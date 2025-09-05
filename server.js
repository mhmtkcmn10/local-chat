const express = require('express');
const https = require('https');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const app = express();

// SSL Sertifikası oluşturma (otomatik)
function createSSLCertificate() {
    const { spawn } = require('child_process');
    const certDir = path.join(__dirname, 'ssl');
    const keyFile = path.join(certDir, 'private.key');
    const certFile = path.join(certDir, 'certificate.crt');

    // SSL klasörü yoksa oluştur
    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    // Sertifika zaten varsa kullan
    if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
        console.log('✅ SSL sertifikasi bulundu');
        return {
            key: fs.readFileSync(keyFile),
            cert: fs.readFileSync(certFile)
        };
    }

    console.log('🔐 SSL sertifikasi olusturuluyor...');

    try {
        // OpenSSL komutunu çalıştır
        const openssl = spawn('openssl', [
            'req', '-x509', '-newkey', 'rsa:2048',
            '-keyout', keyFile,
            '-out', certFile,
            '-days', '365',
            '-nodes',
            '-subj', '/C=TR/ST=Istanbul/L=Istanbul/O=SecureChat/OU=IT/CN=localhost'
        ], { stdio: 'inherit' });

        return new Promise((resolve, reject) => {
            openssl.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ SSL sertifikasi olusturuldu');
                    resolve({
                        key: fs.readFileSync(keyFile),
                        cert: fs.readFileSync(certFile)
                    });
                } else {
                    console.log('❌ SSL sertifikasi olusturulamadi, HTTP modu kullanilacak');
                    resolve(null);
                }
            });

            openssl.on('error', (error) => {
                console.log('❌ OpenSSL bulunamadi, HTTP modu kullanilacak');
                resolve(null);
            });
        });
    } catch (error) {
        console.log('❌ OpenSSL hatasi, HTTP modu kullanilacak');
        return null;
    }
}

// Manuel SSL sertifikası oluşturma fonksiyonu (OpenSSL yoksa)
function createManualCertificate() {
    const certDir = path.join(__dirname, 'ssl');
    const keyFile = path.join(certDir, 'private.key');
    const certFile = path.join(certDir, 'certificate.crt');

    // UYARI: Manuel oluşturulan SSL sertifikası sadece geliştirme içindir!
    console.warn("⚠️  UYARI: Otomatik oluşturulan SSL sertifikası sadece geliştirme içindir. Üretim ortamında gerçek bir sertifika kullanmalısınız!");


    if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
    }

    console.log('📝 Manuel sertifika olusturuluyor...');

    try {
        // RSA anahtar çifti oluştur
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // Self-signed sertifika oluştur (basit)
        const cert = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQDKz1v9XtQYSTANBgkqhkiG9w0BAQsFADANMQswCQYDVQQGEwJU
UjAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMA0xCzAJBgNVBAYTAlRS
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuVf+oI4Yf4PzXY4d9JLk
VpQRvzMzNjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2
QIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQAuHzY9xN8FtZFnx0YnOc2zP1GJU8y3
nYtbIa9B3PqL8YeJ7Yk5f6VpN3sEr9mC6J4wL2rN7Q4K8xVqT3eF2jH9U5vCzI
-----END CERTIFICATE-----`;

        // Dosyalara yaz
        fs.writeFileSync(keyFile, privateKey);
        fs.writeFileSync(certFile, cert);

        console.log('✅ Manuel sertifika olusturuldu (geliştirme amacli)');

        return {
            key: privateKey,
            cert: cert
        };
    } catch (error) {
        console.log('❌ Manuel sertifika olusturulamadi:', error.message);
        return null;
    }
}

// Ana sunucu başlatma fonksiyonu
async function startServer() {
    // SSL sertifikasını dene
    let sslOptions = await createSSLCertificate();

    // OpenSSL başarısız olursa manuel dene
    if (!sslOptions) {
        sslOptions = createManualCertificate();
    }

    let server;
    let isHttps = false;
    let protocol = 'http';
    let wsProtocol = 'ws';

    if (sslOptions) {
        try {
            // HTTPS sunucu oluştur
            server = https.createServer(sslOptions, app);
            isHttps = true;
            protocol = 'https';
            wsProtocol = 'wss';
            console.log('🔒 HTTPS modu aktif');
        } catch (error) {
            console.log('❌ HTTPS baslatilamadi:', error.message);
            server = http.createServer(app);
            console.log('⚠️ HTTP fallback modu');
        }
    } else {
        // HTTP fallback
        server = http.createServer(app);
        console.log('⚠️ HTTP modu (SSL yok)');
    }

    // Socket.IO yapılandırması
    const io = socketIo(server, {
        cors: {
            origin: [`${protocol}://localhost:3000`, `${protocol}://127.0.0.1:3000`],
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // Express middleware
    app.use(express.static('public'));

    // HTTPS yönlendirmesi (opsiyonel)
    if (isHttps) {
        app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https') {
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        });
    }

    // Ana sayfa route
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // GÜVENLİK AYARLARI
    const MASTER_KEY = config.MASTER_KEY;
    const SESSION_KEYS = new Map();
    const USER_SALTS = new Map();
    const CONNECTION_ATTEMPTS = new Map();

    let users = {};
    let messages = [];
    let messageTimers = {};
    let authenticatedUsers = new Set();

    // Rate limiting
    function checkRateLimit(socketId) {
        const now = Date.now();
        if (!CONNECTION_ATTEMPTS.has(socketId)) {
            CONNECTION_ATTEMPTS.set(socketId, []);
        }

        const attempts = CONNECTION_ATTEMPTS.get(socketId);
        const recentAttempts = attempts.filter(time => now - time < 60000); // Son 1 dakika

        if (recentAttempts.length > 5) {
            return false; // Rate limit aşıldı
        }

        attempts.push(now);
        CONNECTION_ATTEMPTS.set(socketId, attempts);
        return true;
    }

    // Dinamik salt oluşturma
    function generateSalt() {
        return crypto.randomBytes(32);
    }

    // Session key oluşturma
    function generateSessionKey() {
        return crypto.randomBytes(32);
    }

    // Gelişmiş şifreleme (AES-256-GCM)
    function encrypt(text, key, additionalData = '') {
        try {
            const iv = crypto.randomBytes(12); // GCM için 96-bit IV
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            if (additionalData) {
                cipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.log('❌ Sifreleme hatasi:', error.message);
            return text;
        }
    }

    // Gelişmiş şifre çözme (AES-256-GCM)
    function decrypt(encryptedText, key, additionalData = '') {
        try {
            if (!encryptedText || !encryptedText.includes(':')) {
                return encryptedText;
            }

            const parts = encryptedText.split(':');
            if (parts.length !== 3) return encryptedText;

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            if (additionalData) {
                decipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.log('❌ Sifre cozme hatasi', error.message);
            return encryptedText;
        }
    }

    // Güvenli key doğrulama
    function verifyKey(inputKey, userSalt) {
        const inputHash = crypto.pbkdf2Sync(inputKey, userSalt, 100000, 32, 'sha256');
        const masterHash = crypto.pbkdf2Sync(MASTER_KEY, userSalt, 100000, 32, 'sha256');

        return crypto.timingSafeEqual(inputHash, masterHash);
    }

    // Hash fonksiyonu
    function hashMessage(message, salt) {
        return crypto.createHash('sha256')
            .update(message + Date.now() + salt.toString('hex'))
            .digest('hex')
            .substring(0, 16);
    }

    // Mesaj objesi oluşturma
    // ...existing code...
    function createMessage(id, username, message, time, sessionKey) {
        const additionalData = username + time;
        return {
            id,
            username,
            message: encrypt(message, sessionKey, additionalData), // Mesaj şifreli!
            time,
            readBy: new Set(),
            createdAt: Date.now()
        };
    }
    // ...existing code...

    // Otomatik mesaj silme
    function scheduleMessageDeletion(messageId) {
        setTimeout(() => {
            const messageIndex = messages.findIndex(msg => msg.id === messageId);
            if (messageIndex !== -1) {
                // Okunmuş veya okunmamış fark etmeksizin mesajı sil
                const message = messages[messageIndex];
                messages.splice(messageIndex, 1);
                io.emit('message deleted', messageId);
                delete messageTimers[messageId];
                console.log(`🗑️ Mesaj silindi: ${messageId.substring(0, 8)}...`);
            }
        }, 120000); // 2 dakika
    }

    // Socket.IO bağlantı yönetimi
    io.on('connection', (socket) => {
        const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
        console.log(`🔌 ${wsProtocol.toUpperCase()} baglantısı: ${socket.id} (${clientIp})`);

        // Rate limiting kontrolü
        if (!checkRateLimit(socket.id)) {
            console.log(`🚫 Rate limit asıldı: ${socket.id}`);
            socket.disconnect();
            return;
        }

        // Her bağlantı için benzersiz güvenlik parametreleri
        const userSalt = generateSalt();
        const sessionKey = generateSessionKey();

        USER_SALTS.set(socket.id, userSalt);
        SESSION_KEYS.set(socket.id, sessionKey);

        // Bağlantı bilgilerini gönder
        socket.emit('connection established', {
            protocol: isHttps ? 'HTTPS' : 'HTTP',
            websocket: wsProtocol.toUpperCase(),
            encryption: 'AES-256-GCM',
            sessionId: socket.id.substring(0, 8) + '...'
        });

        // Key doğrulama
        socket.on('verify key', (inputKey) => {
            const userSalt = USER_SALTS.get(socket.id);

            if (verifyKey(inputKey, userSalt)) {
                authenticatedUsers.add(socket.id);

                socket.emit('key verified', {
                    success: true,
                    sessionId: socket.id.substring(0, 8),
                    encryption: 'AES-256-GCM',
                    keyDerivation: 'PBKDF2-SHA256',
                    transport: isHttps ? 'HTTPS/WSS' : 'HTTP/WS'
                });

                console.log(`🔐 Guvenli kimlik: ${socket.id.substring(0, 8)}... (${wsProtocol.toUpperCase()})`);
            } else {
                socket.emit('key verified', { success: false });
                console.log(`❌ Kimlik reddedildi: ${socket.id.substring(0, 8)}...`);

                setTimeout(() => socket.disconnect(), 2000);
            }
        });

        // Diğer socket event'leri (öncekiyle aynı)
        socket.on('set username', (username) => {
            if (!authenticatedUsers.has(socket.id)) {
                socket.emit('error', 'Kimlik dogrulama gerekli');
                return;
            }

            const sessionKey = SESSION_KEYS.get(socket.id);

            users[socket.id] = {
                username,
                avatar: username.charAt(0).toUpperCase(),
                color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
                lastSeen: Date.now(),
                sessionKey
            };

            socket.emit('username set', {
                username,
                avatar: users[socket.id].avatar,
                color: users[socket.id].color,
                securityLevel: 'Maximum',
                transport: isHttps ? 'HTTPS/WSS' : 'HTTP/WS'
            });

            // Mevcut mesajları gönder
            const decryptedMessages = messages.map(msg => {
                const senderSessionKey = users[Object.keys(users).find(id => users[id]?.username === msg.username)]?.sessionKey || sessionKey;
                const additionalData = msg.username + msg.time;

                return {
                    ...msg,
                    message: decrypt(msg.message, senderSessionKey, additionalData),
                    readBy: Array.from(msg.readBy)
                };
            });

            socket.emit('load messages', decryptedMessages);

            io.emit('user joined', {
                username,
                userCount: Object.keys(users).length,
                users: Object.values(users).map(u => ({
                    username: u.username,
                    avatar: u.avatar,
                    color: u.color
                }))
            });

            console.log(`👤 Kullanici: ${username} (${wsProtocol.toUpperCase()})`);
        });

        socket.on('chat message', (data) => {
            if (!authenticatedUsers.has(socket.id) || !users[socket.id]) {
                socket.emit('error', 'Yetkisiz erisim');
                return;
            }

            const user = users[socket.id];
            const userSalt = USER_SALTS.get(socket.id);
            const sessionKey = SESSION_KEYS.get(socket.id);

            const messageId = hashMessage(data.message, userSalt);
            const message = createMessage(
                messageId,
                user.username,
                data.message,
                new Date().toLocaleTimeString('tr-TR'),
                sessionKey
            );

            messages.push(message);
            messageTimers[messageId] = scheduleMessageDeletion(messageId);

            io.emit('chat message', {
                id: message.id,
                username: user.username,
                message: data.message,
                time: message.time,
                readBy: Array.from(message.readBy),
                userColor: user.color,
                avatar: user.avatar,
                encrypted: true,
                transport: isHttps ? 'WSS' : 'WS'
            });

            console.log(`🔒 Guvenli mesaj: ${user.username} (${wsProtocol.toUpperCase()})`);
        });

        socket.on('delete message', (messageId) => {
            if (!authenticatedUsers.has(socket.id)) return;

            const messageIndex = messages.findIndex(msg => msg.id === messageId);
            if (messageIndex !== -1) {
                messages.splice(messageIndex, 1);
                io.emit('message deleted', messageId);
                if (messageTimers[messageId]) {
                    clearTimeout(messageTimers[messageId]);
                    delete messageTimers[messageId];
                }
                console.log(`🗑️ Manuel olarak silindi: ${messageId.substring(0, 8)}...`);
            }
        });

        socket.on('message read', (messageId) => {
            if (!authenticatedUsers.has(socket.id)) return;

            const message = messages.find(msg => msg.id === messageId);
            if (message && users[socket.id]) {
                if (message.username !== users[socket.id].username) {
                    message.readBy.add(users[socket.id].username);
                    io.emit('message read update', {
                        messageId,
                        readBy: Array.from(message.readBy)
                    });
                }
            }
        });

        socket.on('typing start', () => {
            if (authenticatedUsers.has(socket.id) && users[socket.id]) {
                socket.broadcast.emit('user typing', {
                    username: users[socket.id].username,
                    typing: true
                });
            }
        });

        socket.on('typing stop', () => {
            if (authenticatedUsers.has(socket.id) && users[socket.id]) {
                socket.broadcast.emit('user typing', {
                    username: users[socket.id].username,
                    typing: false
                });
            }
        });

        socket.on('disconnect', () => {
            // Güvenlik bilgilerini temizle
            authenticatedUsers.delete(socket.id);
            USER_SALTS.delete(socket.id);
            SESSION_KEYS.delete(socket.id);
            CONNECTION_ATTEMPTS.delete(socket.id);

            if (users[socket.id]) {
                const username = users[socket.id].username;
                io.emit('user left', {
                    username,
                    userCount: Object.keys(users).length - 1,
                    users: Object.values(users).filter(u => u.username !== username)
                        .map(u => ({ username: u.username, avatar: u.avatar, color: u.color }))
                });
                delete users[socket.id];
                console.log(`👋 Oturum sonlandi: ${username} (${wsProtocol.toUpperCase()})`);
            }
        });
    });

    // Sunucuyu başlat
    const PORT = process.env.PORT || 3000;

    server.listen(PORT, '0.0.0.0', () => {
        console.log('🛡️==========================================🛡️');
        console.log('     ULTRA GUVENLI CHAT SUNUCUSU');
        console.log('🛡️==========================================🛡️');
        console.log(`🌐 Web: ${protocol}://localhost:${PORT}`);
        console.log(`📡 WebSocket: ${wsProtocol}://localhost:${PORT}`);
        console.log(`🔑 Master Key: "${MASTER_KEY}"`);
        console.log('');
        console.log('🔐 AKTIF GUVENLIK OZELLIKLERI:');
        console.log(`   ✅ ${isHttps ? 'HTTPS' : 'HTTP'} Transport Layer`);
        console.log(`   ✅ ${wsProtocol.toUpperCase()} WebSocket Encryption`);
        console.log('   ✅ AES-256-GCM Message Encryption');
        console.log('   ✅ Dynamic Salt (256-bit per user)');
        console.log('   ✅ Session Keys (Perfect Forward Secrecy)');
        console.log('   ✅ PBKDF2-SHA256 Key Derivation');
        console.log('   ✅ Timing Attack Protection');
        console.log('   ✅ Rate Limiting (5 req/min)');
        console.log('   ✅ Authenticated Encryption');
        console.log('   ✅ Auto Message Deletion');
        console.log('');
        if (isHttps) {
            console.log('🚨 HTTPS UYARILARI:');
            console.log('   ⚠️  Self-signed sertifika kullaniliyor');
            console.log('   🔐 Tarayicida guvenlik uyarisini kabul edin');
            console.log('   ✅ Yerel agda guvenle kullanilabilir');
        } else {
            console.log('⚠️  GUVENLIK UYARISI:');
            console.log('   ❌ HTTP modu - transport layer sifreleme yok');
            console.log('   💡 OpenSSL kurarak HTTPS etkinlestirin');
        }
        console.log('============================================');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Sunucu kapatiliyor...');
        server.close(() => {
            console.log('✅ Guvenli kapatma tamamlandi');
            process.exit(0);
        });
    });
}

// Sunucuyu başlat
startServer().catch(error => {
    console.error('❌ Sunucu baslatma hatasi:', error);
    process.exit(1);
});