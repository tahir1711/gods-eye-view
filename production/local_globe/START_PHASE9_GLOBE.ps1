$ErrorActionPreference="Stop"
$Repo="D:\DUserData\God's eye\gods-eye-view"
Set-Location -LiteralPath $Repo
npm run build
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host ""
Write-Host "GOD'S EYE Phase 9 local production globe"
Write-Host "http://127.0.0.1:4173/"
npm run preview -- --host 127.0.0.1 --port 4173
