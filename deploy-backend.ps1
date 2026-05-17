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
$env:GOOS = "linux"; $env:GOARCH = "amd64"
go build -o server ./cmd/api/main.go
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "go build gagal" }
$env:GOOS = ""; $env:GOARCH = ""
Pop-Location
Ok "Binary dikompile: backend-hiresight/server"

# 2. SCP binary ke VM
Step 2 "Kirim binary ke VM..."
scp backend-hiresight/server "${VM}:~/server-new"
if ($LASTEXITCODE -ne 0) { Fail "scp gagal" }
Ok "Binary terkirim"

# 3. Ganti binary di container dan restart
Step 3 "Update container di VM..."
@'
chmod +x ~/server-new
docker stop hiresight 2>/dev/null || true
docker cp ~/server-new hiresight:/app/server
docker start hiresight
sleep 3
echo "--- Logs ---"
docker logs hiresight --tail 8
'@ | ssh $VM bash
if ($LASTEXITCODE -ne 0) { Fail "Update container gagal" }

Write-Host "`n=== Backend berhasil di-deploy! ===" -ForegroundColor Green
Write-Host "API: http://20.198.216.160:8081" -ForegroundColor White
