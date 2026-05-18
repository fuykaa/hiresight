# deploy-backend.ps1
# Jalankan dari root project: .\deploy-backend.ps1
# Tidak perlu Docker Desktop di laptop — binary di-SCP langsung ke VM

$VM = "azureuser@20.198.216.160"

function Step($n, $msg) { Write-Host "`n[$n/3] $msg" -ForegroundColor Cyan }
function Ok($msg)        { Write-Host "OK: $msg" -ForegroundColor Green }
function Fail($msg)      { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Deploy Backend Hiresight ===" -ForegroundColor Yellow

# 1. Cross-compile
Step 1 "Cross-compile Go binary (linux/amd64)..."
Push-Location backend-hiresight
$env:GOOS = "linux"; $env:GOARCH = "amd64"; $env:CGO_ENABLED = "0"
go build -o server ./cmd/api/main.go
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "go build gagal" }
$env:GOOS = ""; $env:GOARCH = ""; $env:CGO_ENABLED = ""
Pop-Location
Ok "Binary dikompile: $([math]::Round((Get-Item 'backend-hiresight/server').Length/1MB,1)) MB"

# 2. SCP binary ke VM dengan keep-alive
Step 2 "Kirim binary ke VM..."
scp -o "ServerAliveInterval=30" -o "ServerAliveCountMax=10" backend-hiresight/server "${VM}:~/server-new"
if ($LASTEXITCODE -ne 0) { Fail "scp gagal" }
Ok "Binary terkirim"

# 3. Ganti binary di container dan restart
Step 3 "Update container di VM..."
@'
set -e

echo "--- Cek container ---"
CONTAINER_STATUS=$(docker inspect hiresight --format "{{.State.Status}}" 2>/dev/null || echo "missing")
echo "Container status: $CONTAINER_STATUS"
[ "$CONTAINER_STATUS" = "missing" ] && { echo "ERROR: container hiresight tidak ditemukan"; exit 1; }

chmod +x ~/server-new
docker stop hiresight
docker cp ~/server-new hiresight:/app/server
docker start hiresight
sleep 3

echo "--- Verifikasi container running ---"
RUNNING=$(docker inspect hiresight --format "{{.State.Running}}" 2>/dev/null || echo "false")
if [ "$RUNNING" != "true" ]; then
  echo "ERROR: container tidak running setelah start — docker logs:"
  docker logs hiresight --tail 20
  exit 1
fi
echo "Container running: OK"

echo "--- Logs terakhir ---"
docker logs hiresight --tail 10
echo "Backend OK!"
'@ | ssh -o "ServerAliveInterval=30" -o "ServerAliveCountMax=10" $VM bash
if ($LASTEXITCODE -ne 0) { Fail "Update container gagal" }

Write-Host "`n=== Backend berhasil di-deploy! ===" -ForegroundColor Green
Write-Host "API: http://20.198.216.160:8081" -ForegroundColor White
