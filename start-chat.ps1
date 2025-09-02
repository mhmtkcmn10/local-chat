# Güvenli Chat Başlatıcı
Write-Host "🔐 Güvenli Chat Başlatılıyor..." -ForegroundColor Green

# Node.js kontrolü
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion bulundu" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js yüklü değil! https://nodejs.org adresinden indirin" -ForegroundColor Red
    Read-Host "Devam etmek için Enter'a basın"
    exit
}

# NPM paketleri kontrolü
if (!(Test-Path "node_modules")) {
    Write-Host "📥 NPM paketleri kuruluyor..." -ForegroundColor Yellow
    npm install
}

# Chrome'u otomatik aç
Start-Process "chrome" "http://localhost:3000" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host "🚀 Sunucu başlatılıyor..." -ForegroundColor Cyan
Write-Host "📱 Chrome otomatik açıldı - Key: MySecureKey2024!" -ForegroundColor Yellow

# Sunucuyu başlat
node server.js