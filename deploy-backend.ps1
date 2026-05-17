# deploy-backend.ps1
# Jalankan dari root project: .\deploy-backend.ps1

$VM = "azureuser@20.198.216.160"
$IMAGE = "hiresight-backend:latest"

# Parse .env
$env_vars = @{}
Get-Content ".env" | Where-Object { $_ -match "^[A-Z]" -and $_ -match "=" } | ForEach-Object {
    $parts = $_ -split "=", 2
    $env_vars[$parts[0].Trim()] = $parts[1].Trim()
}

function Step($n, $msg) { Write-Host "`n[$n/4] $msg" -ForegroundColor Cyan }
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

# 2. Build Docker image
Step 2 "Build Docker image..."
docker build -t $IMAGE backend-hiresight/
if ($LASTEXITCODE -ne 0) { Fail "docker build gagal" }
Ok "Image: $IMAGE"

# 3. Save & SCP
Step 3 "Kirim image ke VM..."
docker save $IMAGE | gzip > backend.tar.gz
scp backend.tar.gz "${VM}:~/"
if ($LASTEXITCODE -ne 0) { Remove-Item backend.tar.gz; Fail "scp gagal" }
Remove-Item backend.tar.gz
Ok "Image terkirim"

# 4. Deploy di VM
Step 4 "Deploy container di VM..."
$docker_run = @"
docker load < ~/backend.tar.gz
docker stop hiresight 2>/dev/null || true
docker rm hiresight 2>/dev/null || true
docker run -d --name hiresight --restart unless-stopped \
  -e DB_HOST=$($env_vars["DB_HOST"]) \
  -e DB_PORT=$($env_vars["DB_PORT"]) \
  -e DB_USER=$($env_vars["DB_USER"]) \
  -e DB_PASSWORD='$($env_vars["DB_PASSWORD"])' \
  -e DB_NAME=$($env_vars["DB_NAME"]) \
  -e DB_SSLMODE=$($env_vars["DB_SSLMODE"]) \
  -e JWT_SECRET=$($env_vars["JWT_SECRET"]) \
  -e CORS_ORIGIN=http://20.198.216.160 \
  -e GROQ_API_KEY=$($env_vars["GROQ_API_KEY"]) \
  -e AZURE_FORM_RECOGNIZER_ENDPOINT=$($env_vars["AZURE_FORM_RECOGNIZER_ENDPOINT"]) \
  -e AZURE_FORM_RECOGNIZER_KEY=$($env_vars["AZURE_FORM_RECOGNIZER_KEY"]) \
  -e AZURE_STORAGE_ACCOUNT_NAME=$($env_vars["AZURE_STORAGE_ACCOUNT_NAME"]) \
  -e AZURE_STORAGE_ACCOUNT_KEY='$($env_vars["AZURE_STORAGE_ACCOUNT_KEY"])' \
  -e AZURE_STORAGE_CONTAINER_RESUMES=$($env_vars["AZURE_STORAGE_CONTAINER_RESUMES"]) \
  -e AZURE_STORAGE_CONTAINER_AVATARS=$($env_vars["AZURE_STORAGE_CONTAINER_AVATARS"]) \
  -p 8081:8081 \
  hiresight-backend:latest
sleep 2
echo "--- Logs ---"
docker logs hiresight --tail 5
"@

$docker_run | ssh $VM bash
if ($LASTEXITCODE -ne 0) { Fail "Deploy di VM gagal" }

Write-Host "`n=== Backend berhasil di-deploy! ===" -ForegroundColor Green
Write-Host "API: http://20.198.216.160:8081" -ForegroundColor White
