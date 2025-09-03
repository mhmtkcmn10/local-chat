# Ultra Güvenli Local Chat

Yerel ağda uçtan uca şifreli, ultra güvenli sohbet uygulaması.

## Kurulum

1. Node.js ve (isteğe bağlı) OpenSSL kurulu olmalı.
2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
3. Sunucuyu başlatın:
   ```
   start-chat.bat
   ```
4. Kod debug
    ```
   node server.js
   ```

## Özellikler

- AES-256-GCM ile şifreleme
- Otomatik SSL sertifikası (geliştirme için)
- HTTPS/HTTP desteği
- Kullanıcı adı benzersizliği
- Otomatik mesaj silme (2 dakika)
- Rate limiting

## Güvenlik

- Otomatik oluşturulan SSL sertifikası **sadece geliştirme içindir**.
- Üretim ortamında gerçek bir SSL sertifikası kullanın.
- Master Key ve oturum anahtarlarını gizli tutun.

## Katkı

Pull request ve önerilere açıktır.

## Lisans

ISC