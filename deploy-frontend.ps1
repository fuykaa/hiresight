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

# 2. Package standalone (Next.js 16 Turbopack sudah menyertakan static & public di dalam standalone)
Step 2 "Package standalone..."
Pop-Location
tar -czf frontend-deploy.tar.gz -C "hiresight-app/.next/standalone" .
if ($LASTEXITCODE -ne 0) { Fail "tar gagal" }
Ok "Package: frontend-deploy.tar.gz ($([math]::Round((Get-Item frontend-deploy.tar.gz).Length/1MB,1)) MB)"

# 3. SCP ke VM
Step 3 "Kirim ke VM..."
scp frontend-deploy.tar.gz "${VM}:~/"
if ($LASTEXITCODE -ne 0) { Remove-Item frontend-deploy.tar.gz; Fail "scp gagal" }
Remove-Item frontend-deploy.tar.gz
Ok "File terkirim"

# 4. Deploy di VM
Step 4 "Deploy di VM..."
@'
pkill -f "node server.js" 2>/dev/null || true
sleep 1
rm -rf ~/hiresight-frontend
mkdir -p ~/hiresight-frontend
tar -xzf ~/frontend-deploy.tar.gz -C ~/hiresight-frontend
chmod -R 755 ~/hiresight-frontend
cd ~/hiresight-frontend
PORT=3000 nohup node server.js > ~/frontend.log 2>&1 &
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "Health check: $STATUS"
[ "$STATUS" = "200" ] && echo "Frontend OK!" || echo "WARNING: health check gagal, cek ~/frontend.log"
'@ | ssh $VM bash
if ($LASTEXITCODE -ne 0) { Fail "Deploy di VM gagal" }

Write-Host "`n=== Frontend berhasil di-deploy! ===" -ForegroundColor Green
Write-Host "URL: http://20.198.216.160" -ForegroundColor White
