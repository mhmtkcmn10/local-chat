@echo off
cd /d "%~dp0"
title Ultra Güvenli Chat Sunucusu

:start_server

color 0A
echo.
echo 🛡️==========================================🛡️
echo      ULTRA GÜVENLİ CHAT BAŞLATILIYOR...
echo 🛡️==========================================🛡️
echo.

REM Admin yetkisi kontrolü
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  UYARI: Admin yetkisiyle çalıştırmanız önerilir
    echo    SSL sertifikası oluşturmak için gerekli olabilir
    echo.
)

REM Node.js kontrolü
echo 📋 Sistem gereksinimleri kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ HATA: Node.js bulunamadı!
    echo.
    echo 🔗 Node.js indirin: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% bulundu

REM OpenSSL kontrolü
echo 🔐 SSL desteği kontrol ediliyor...
openssl version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('openssl version') do set OPENSSL_VERSION=%%i
    echo ✅ OpenSSL %OPENSSL_VERSION% bulundu - HTTPS etkin
    set HTTPS_AVAILABLE=true
) else (
    echo ⚠️  OpenSSL bulunamadı - HTTP modu kullanılacak
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
        echo ❌ NPM kurulum hatası!
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
    choice /c YN /m "Mevcut servisi sonlandırıp devam etmek istiyor musunuz?"
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
echo 🔐 GÜVENLİK BİLGİLERİ:
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
choice /c YN /m "Chrome otomatik açılsın mı?"
if errorlevel 2 (
    set AUTO_OPEN=false
    echo 📋 Manuel erişim gerekecek
) else (
    set AUTO_OPEN=true
    echo ✅ Chrome otomatik açılacak
)

echo.
echo 🚀 Sunucu başlatılıyor...
echo ========================
echo.

REM Chrome otomatik açma (düzeltilmiş)
if "%AUTO_OPEN%"=="true" (
    if "%HTTPS_AVAILABLE%"=="true" (
        echo 🔐 HTTPS modunda Chrome 5 saniye sonra açılacak...
        echo ⚠️  SSL sertifika uyarısını kabul etmeyi unutmayın!
        start /min cmd /c "timeout /t 5 /nobreak >nul && start chrome --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content https://localhost:3000"
    ) else (
        echo 🌐 HTTP modunda Chrome 3 saniye sonra açılacak...
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
    echo ❌ Sunucu hatayla sonlandı (Exit Code: %errorlevel%)
    echo.
    echo 🔍 Olası nedenler:
    echo    • Port 3000 başka uygulama tarafından kullanılıyor
    echo    • SSL sertifikası oluşturulamadı
    echo    • Node.js modülleri eksik veya bozuk
    echo    • Firewall/antivirus engeli
    echo    • server.js dosyası bulunamadı
    echo.
    echo 💡 Çözüm önerileri:
    echo    • Klasörde server.js dosyasının olduğunu kontrol edin
    echo    • npm install komutu çalıştırın
    echo    • Admin yetkisiyle çalıştırmayı deneyin
    echo    • Port 3000'i kullanan diğer uygulamaları kapatın
    echo.
) else (
    echo ✅ Sunucu normal şekilde sonlandı
)

echo 📋 Hata devam ederse server.js ve package.json dosyalarını kontrol edin
echo.

choice /c YN /m "Sunucuyu yeniden başlatmak istiyor musunuz?"
if errorlevel 1 if not errorlevel 2 (
    echo.
    echo 🔄 Yeniden başlatılıyor...
    echo.
    timeout /t 2 /nobreak >nul
    cls
    goto start_server
)

echo.
echo 👋 Ultra Güvenli Chat kapatılıyor...
echo 🔐 Güvenli sohbetler dileriz!
echo.
timeout /t 3 /nobreak >nul@echo off
cd /d "%~dp0"
title Ultra Güvenli Chat Sunucusu

color 0A
echo.
echo 🛡️==========================================🛡️
echo      ULTRA GÜVENLİ CHAT BAŞLATILIYOR...
echo 🛡️==========================================🛡️
echo.

REM Admin yetkisi kontrolü
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  UYARI: Admin yetkisiyle çalıştırmanız önerilir
    echo    SSL sertifikası oluşturmak için gerekli olabilir
    echo.
)

REM Node.js kontrolü
echo 📋 Sistem gereksinimleri kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ HATA: Node.js bulunamadı!
    echo.
    echo 🔗 Node.js indirin: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% bulundu

REM OpenSSL kontrolü
echo 🔐 SSL desteği kontrol ediliyor...
openssl version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('openssl version') do set OPENSSL_VERSION=%%i
    echo ✅ OpenSSL %OPENSSL_VERSION% bulundu - HTTPS etkin
    set HTTPS_AVAILABLE=true
) else (
    echo ⚠️  OpenSSL bulunamadı - HTTP modu kullanılacak
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
        echo ❌ NPM kurulum hatası!
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
    choice /c YN /m "Mevcut servisi sonlandırıp devam etmek istiyor musunuz?"
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
echo 🔐 GÜVENLİK BİLGİLERİ:
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
choice /c YN /m "Chrome otomatik açılsın mı?"
if errorlevel 2 (
    set AUTO_OPEN=false
) else (
    set AUTO_OPEN=true
)

echo.
echo 🚀 Sunucu başlatılıyor...
echo ========================
echo.

if "%AUTO_OPEN%"=="true" (
    if "%HTTPS_AVAILABLE%"=="true" (
        echo 🔐 HTTPS modunda Chrome 5 saniye sonra açılacak...
if "%AUTO_OPEN%"=="true" (
    if "%HTTPS_AVAILABLE%"=="true" (
        echo 🔐 HTTPS modunda Chrome 5 saniye sonra açılacak...
        start /B timeout /t 5 /nobreak >nul 2>&1 && start chrome --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content "https://localhost:3000"
    ) else (
        echo 🌐 HTTP modunda Chrome 3 saniye sonra açılacak...
        start /B timeout /t 3 /nobreak >nul 2>&1 && start chrome "http://localhost:3000"
    )
    echo ✅ Chrome otomatik açma zamanlandı
) else (
    echo 📋 Manuel erişim için:
    if "%HTTPS_AVAILABLE%"=="true" (
        echo    https://localhost:3000
    ) else (
        echo    http://localhost:3000
    )
)

echo.
echo 🔥 SUNUCU BAŞLATILIYOR...
echo ========================

REM Sunucuyu başlat
node server.js

REM Sunucu kapandıktan sonra
echo.
echo.
echo 🛑 Sunucu durduruldu
echo.

if %errorlevel% neq 0 (
    echo ❌ Sunucu hatayla sonlandı (Kod: %errorlevel%)
    echo.
    echo 🔍 Olası nedenler:
    echo    • Port 3000 başka uygulama tarafından kullanılıyor
    echo    • SSL sertifikası oluşturulamadı
    echo    • Node.js modülleri eksik
    echo    • Firewall sorunu
    echo.
) else (
    echo ✅ Sunucu normal şekilde sonlandı
)

echo 📋 Log dosyasını incelemek için server.js dosyasını kontrol edin
echo.

choice /c YN /m "Yeniden başlatmak istiyor musunuz?"
if errorlevel 1 if not errorlevel 2 (
    echo.
    echo 🔄 Yeniden başlatılıyor...
    timeout /t 2 /nobreak >nul
    goto :start_server
)

echo.
echo 👋 İyi günler! Güvenli sohbetler dileriz.
pause >nul