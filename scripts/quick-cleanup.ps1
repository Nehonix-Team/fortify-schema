# Quick Fortify Schema VSCode Cleanup
# One-liner script for immediate cleanup

$settingsPath = "$env:APPDATA\Code\User\settings.json"

if (-not (Test-Path $settingsPath)) {
    Write-Host "No VSCode settings found. You're all clean!" -ForegroundColor Green
    exit 0
}

$content = Get-Content $settingsPath -Raw
if ($content -notmatch "fortify") {
    Write-Host "No Fortify settings found. You're already clean!" -ForegroundColor Green
    exit 0
}

Write-Host "Found Fortify settings. Running cleanup..." -ForegroundColor Yellow

# Download and run the full cleanup script
$scriptUrl = "http://dll.nehonix.com/scripts/cleanup-vscode-simple.ps1"
$tempScript = "$env:TEMP\fortify-cleanup.ps1"

try {
    Invoke-WebRequest -Uri $scriptUrl -OutFile $tempScript -UseBasicParsing
    & powershell -ExecutionPolicy Bypass -File $tempScript
    Remove-Item $tempScript -ErrorAction SilentlyContinue
} catch {
    Write-Host "Failed to download cleanup script. Please run manual cleanup:" -ForegroundColor Red
    Write-Host "1. Open VSCode settings (Ctrl+Shift+P -> 'Preferences: Open Settings (JSON)')" -ForegroundColor Yellow
    Write-Host "2. Remove any lines containing 'fortify'" -ForegroundColor Yellow
    Write-Host "3. Save and restart VSCode" -ForegroundColor Yellow
}
