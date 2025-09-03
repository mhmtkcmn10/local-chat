@echo off
cd /d "%~dp0"
title Ultra Güvenli Chat Sunucusu

:start_server

color 0A
echo.
echo 🛡️==========================================🛡️
echo      ULTRA GUVENLI CHAT BASLATILIYOR...
echo 🛡️==========================================🛡️
echo.

REM Admin yetkisi kontrolü
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  UYARI: Admin yetkisiyle calistirmaniz onerilir
    echo    SSL sertifikasi olusturmak icin gerekli olabilir
    echo.
)

REM Node.js kontrolü
echo 📋 Sistem gereksinimleri kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ HATA: Node.js bulunamadi!
    echo.
    echo 🔗 Node.js indirin: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% bulundu

REM OpenSSL kontrolü
echo 🔐 SSL destegi kontrol ediliyor...
openssl version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('openssl version') do set OPENSSL_VERSION=%%i
    echo ✅ OpenSSL %OPENSSL_VERSION% bulundu - HTTPS etkin
    set HTTPS_AVAILABLE=true
) else (
    echo ⚠️  OpenSSL bulunamadi - HTTP modu kullanilacak
    echo.
    echo 💡 HTTPS için OpenSSL kurumu:
    echo    • Windows: choco install openssl
    echo    • Veya: https://slproweb.com/products/Win32OpenSSL.html
    echo.
    set HTTPS_AVAILABLE=false
)

REM NPM paketleri kontrolü
echo 📦 Dependencies kontrol ediliyor...
if not exist "node_modules" (
    echo 📥 NPM paketleri kuruluyor...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ NPM kurulum hatas!
        pause
        exit /b 1
    )
    echo ✅ Dependencies kuruldu
) else (
    echo ✅ Dependencies mevcut
)

REM Port kullanımı kontrolü
echo 🔍 Port 3000 durumu kontrol ediliyor...
netstat -an | find "3000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 kullanımda!
    echo.
    choice /c YN /m "Mevcut servisi sonlandirip devam etmek istiyor musunuz?"
    if errorlevel 2 (
        echo ❌ İşlem iptal edildi
        pause
        exit /b 1
    )
    echo 🔄 Port temizleniyor...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Güvenlik bilgileri
echo.
echo 🔐 GUVENLIK BILGILERI:
echo =====================
echo 🔑 Master Key: MySecureKey2024!
if "%HTTPS_AVAILABLE%"=="true" (
    echo 🌐 Protokol: HTTPS/WSS (Güvenli)
    echo 📱 Erişim: https://localhost:3000
) else (
    echo 🌐 Protokol: HTTP/WS (Temel)
    echo 📱 Erişim: http://localhost:3000
)
echo 🛡️  Şifreleme: AES-256-GCM
echo ⏰ Otomatik mesaj silme: 2 dakika
echo.

REM Chrome otomatik açma seçeneği
choice /c YN /m "Chrome otomatik acilsin mi?"
if errorlevel 2 (
    set AUTO_OPEN=false
    echo 📋 Manuel erisim gerekecek
) else (
    set AUTO_OPEN=true
    echo ✅ Chrome otomatik acılacak
)

echo.
echo 🚀 Sunucu baslatiliyor...
echo ========================
echo.

REM 
if "%AUTO_OPEN%"=="true" (
    if "%HTTPS_AVAILABLE%"=="true" (
        echo 🔐 HTTPS modunda Chrome 5 saniye sonra acilacak ...
        echo ⚠️  SSL sertifika uyarısını kabul etmeyi unutmayın!
        start /min cmd /c "timeout /t 5 /nobreak >nul && start chrome --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content https://localhost:3000"
    ) else (
        echo 🌐 HTTP modunda Chrome 3 saniye sonra acilacak ...
        start /min cmd /c "timeout /t 3 /nobreak >nul && start chrome http://localhost:3000"
    )
)

echo.
echo 🔥 NODE.JS SUNUCUSU BAŞLATILIYOR...
echo ===================================

REM Sunucuyu başlat (ana işlem)
node server.js

REM Sunucu kapandıktan sonra
echo.
echo.
echo 🛑 Sunucu durduruldu
echo.

if %errorlevel% neq 0 (
    echo ❌ Sunucu hatayla sonlandi (Exit Code: %errorlevel%)
    echo.
    echo 🔍 Olasi nedenler:
    echo    • Port 3000 baska uygulama tarafindan kullaniliyor
    echo    • SSL sertifikasi olusturulamadi
    echo    • Node.js modulleri eksik veya bozuk
    echo    • Firewall/antivirus engeli
    echo    • server.js dosyasi bulunamadi
    echo.
    echo 💡 Çözüm önerileri:
    echo    • Klasorde server.js dosyasinin oldugunu kontrol edin
    echo    • npm install komutu calistirin
    echo    • Admin yetkisiyle calistirmayi deneyin
    echo    • Port 3000'i kullanan diğer uygulamalari kapatin
    echo.
) else (
    echo ✅ Sunucu normal sekilde sonlandi
)

echo 📋 Hata devam ederse server.js ve package.json dosyalarını kontrol edin
echo.

choice /c YN /m "Sunucuyu yeniden baslatmak istiyor musunuz?"
if errorlevel 1 if not errorlevel 2 (
    echo.
    echo 🔄 Yeniden başlatılıyor...
    echo.
    timeout /t 2 /nobreak >nul
    cls
    goto start_server
)

echo.
echo 👋 Ultra Güvenli Chat kapatiliyor...
echo 🔐 Güvenli sohbetler dileriz!
echo.
timeout /t 3 /nobreak >nul
pause >nul
