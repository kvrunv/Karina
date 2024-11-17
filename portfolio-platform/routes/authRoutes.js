const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateSecret, generateQRCode, verifyToken } = require('../auth');
const { isAdmin, isEditor } = require('../middlewares/auth');
const authenticator = require('otplib').authenticator; // Подключаем otplib для двухфакторной аутентификации
const router = express.Router();

// Страница логина
router.get('/login', (req, res) => {
  res.render('login', { error: null, twoFactorRequired: false });
});

// Обработка POST запроса на логин
router.post('/login', async (req, res) => {
  const { username, password, twoFactorCode } = req.body;

  try {
    // Проверка, существует ли пользователь с таким username
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Пользователь не найден', twoFactorRequired: false });
    }

    // Проверка пароля
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.render('login', { error: 'Неверный пароль', twoFactorRequired: false });
    }

    // Если двухфакторная аутентификация включена, проверяем одноразовый код
    if (user.twoFactorSecret) {
      if (!twoFactorCode) {
        return res.render('login', { error: 'Введите код двухфакторной аутентификации', twoFactorRequired: true });
      }

      const isValid = authenticator.verify({ token: twoFactorCode, secret: user.twoFactorSecret });
      if (!isValid) {
        return res.render('login', { error: 'Неверный код двухфакторной аутентификации', twoFactorRequired: true });
      }
    }

    // Сохраняем информацию о пользователе в сессии
    req.session.user = user;

    // Перенаправляем на страницу портфолио
    res.redirect('/portfolio');
  } catch (err) {
    console.error('Ошибка при логине:', err.message);
    res.status(500).send(`Ошибка сервера: ${err.message}`);
  }
});

// Страница регистрации
router.get('/register', (req, res) => {
  res.render('register', { error: null, qrCode: null, secret: null });
});

// Обработка POST запроса на регистрацию
router.post('/register', async (req, res) => {
  const { username, password, firstName, lastName, age, gender, email, role } = req.body;

  try {
    // Проверка, существует ли уже пользователь с таким username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: 'Пользователь с таким именем уже существует.', qrCode: null, secret: null });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Генерация секрета для двухфакторной аутентификации
    const secret = generateSecret();

    // Если роль не указана, по умолчанию присваиваем "editor"
    const userRole = role || 'editor';

    // Создание нового пользователя
    const newUser = new User({
      username,
      password: hashedPassword,
      firstName,
      lastName,
      age,
      gender,
      email,
      role: userRole, // Роль выбранная пользователем
      twoFactorSecret: secret.base32 // Секрет для 2FA
    });

    // Сохраняем нового пользователя в базе данных
    await newUser.save();

    // Генерация QR-кода для Google Authenticator
    const qrCode = await generateQRCode(secret);  // Получаем QR-код

    // Перенаправление на страницу регистрации с отображением QR-кода
    res.render('register', { error: null, qrCode, secret: secret.base32 });
  } catch (err) {
    console.error('Ошибка при регистрации:', err.message);
    res.status(500).send(`Ошибка сервера: ${err.message}`);
  }
});

module.exports = router;
