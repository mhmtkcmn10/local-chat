
Write-Host "🔐 Chat Başlatılıyor..." -ForegroundColor Green

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion bulundu" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js yüklü degil! https://nodejs.org adresinden indirin" -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a basın"
    exit
}

if (!(Test-Path "node_modules")) {
    Write-Host "📥 NPM paketleri kuruluyor..." -ForegroundColor Yellow
    npm install
}

Start-Process "chrome" "http://localhost:3000" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "🚀 Sunucu baslatiliyor..." -ForegroundColor Cyan
Write-Host "📱 Chrome otomatik acildi - Key: MySecureKey2024!" -ForegroundColor Yellow

node server.js