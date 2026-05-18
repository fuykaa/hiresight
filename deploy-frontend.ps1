# deploy-frontend.ps1
# Jalankan dari root project: .\deploy-frontend.ps1

$VM      = "azureuser@20.198.216.160"
$API_URL = "http://20.198.216.160"

function Step($n, $msg) { Write-Host "`n[$n/4] $msg" -ForegroundColor Cyan }
function Ok($msg)        { Write-Host "OK: $msg" -ForegroundColor Green }
function Fail($msg)      { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Deploy Frontend Hiresight ===" -ForegroundColor Yellow

# 1. Build Next.js standalone
Step 1 "Build Next.js (standalone)..."
Push-Location hiresight-app
$env:NEXT_PUBLIC_API_URL = $API_URL
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm run build gagal" }
Ok "Build selesai"
Pop-Location

# 2. Package standalone + static files
Step 2 "Package standalone..."
# Next.js standalone tidak include .next/static & public — harus copy manual
Copy-Item -Recurse -Force "hiresight-app/.next/static" "hiresight-app/.next/standalone/.next/static"
if (Test-Path "hiresight-app/public") {
    Copy-Item -Recurse -Force "hiresight-app/public" "hiresight-app/.next/standalone/public"
}
tar -czf frontend-deploy.tar.gz -C "hiresight-app/.next/standalone" .
if ($LASTEXITCODE -ne 0) { Fail "tar gagal" }
Ok "Package: frontend-deploy.tar.gz ($([math]::Round((Get-Item frontend-deploy.tar.gz).Length/1MB,1)) MB)"

# 3. SCP ke VM dengan keep-alive agar tidak putus di tengah jalan
Step 3 "Kirim ke VM..."
scp -o "ServerAliveInterval=30" -o "ServerAliveCountMax=10" frontend-deploy.tar.gz "${VM}:~/"
if ($LASTEXITCODE -ne 0) {
    Remove-Item frontend-deploy.tar.gz -ErrorAction SilentlyContinue
    Fail "scp gagal"
}
Remove-Item frontend-deploy.tar.gz
Ok "File terkirim"

# 4. Deploy di VM
Step 4 "Deploy di VM..."
@'
set -e

echo "--- [1/4] Stop proses lama ---"
pkill -f "node server.js" 2>/dev/null || true
sleep 1

echo "--- [2/4] Ekstrak file baru ---"
rm -rf ~/hiresight-frontend
mkdir -p ~/hiresight-frontend
tar -xzf ~/frontend-deploy.tar.gz -C ~/hiresight-frontend
chmod -R 755 ~/hiresight-frontend

echo "--- Verifikasi static files ---"
CHUNKS=$(ls ~/hiresight-frontend/.next/static/chunks/ 2>/dev/null | wc -l)
if [ "$CHUNKS" -lt 1 ]; then
  echo "ERROR: .next/static/chunks kosong — tar tidak menyertakan static files"
  exit 1
fi
echo "Static chunks: $CHUNKS file OK"

echo "--- [3/4] Update Nginx config ---"
sudo tee /etc/nginx/sites-available/hiresight > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location /_next/static/ {
        alias /home/azureuser/hiresight-frontend/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /home/azureuser/hiresight-frontend/public/;
    }

    # Backend Go — login, register, semua /api/*
    location ~ ^/(login|register|api)(/|$) {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
    }
}
NGINX_EOF
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx config updated OK"

echo "--- [4/4] Start Node.js server ---"
cd ~/hiresight-frontend
PORT=3000 HOSTNAME=127.0.0.1 nohup node server.js > ~/frontend.log 2>&1 &
sleep 4

NODE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000)
echo "Node.js health check: $NODE_STATUS"
if [ "$NODE_STATUS" != "200" ]; then
  echo "ERROR: Node.js tidak merespons — isi frontend.log:"
  tail -30 ~/frontend.log
  exit 1
fi

NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
echo "Nginx health check: $NGINX_STATUS"
[ "$NGINX_STATUS" = "200" ] && echo "Semua berjalan!" || echo "WARNING: Nginx tidak merespons 200"
'@ | ssh -o "ServerAliveInterval=30" -o "ServerAliveCountMax=10" $VM bash
if ($LASTEXITCODE -ne 0) { Fail "Deploy di VM gagal" }

Write-Host "`n=== Frontend berhasil di-deploy! ===" -ForegroundColor Green
Write-Host "URL: http://20.198.216.160" -ForegroundColor White
