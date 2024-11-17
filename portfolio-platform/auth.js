const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Генерация секрета для двухфакторной аутентификации
const generateSecret = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  return secret;
};

// Генерация QR-кода для Google Authenticator
const generateQRCode = (secret) => {
  const otpauthUrl = secret.otpauth_url;  // URL для Google Authenticator
  return new Promise((resolve, reject) => {
    qrcode.toDataURL(otpauthUrl, (err, dataUrl) => {
      if (err) {
        reject(err);
      } else {
        resolve(dataUrl);
      }
    });
  });
};

// Проверка кода
const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret.base32,  // секрет в base32
    encoding: 'base32',
    token: token  // Тотп-код, который вводит пользователь
  });
};

module.exports = { generateSecret, generateQRCode, verifyToken };
