const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const User = require('../models/User');  // Модель пользователя

// Регистрация нового пользователя
const registerUser = async (req, res) => {
  const { username, password, firstName, lastName, age, gender, email } = req.body;

  // Проверка на существование пользователя с таким же email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send('User with this email already exists');
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);

  // Генерация токена для подтверждения email
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  // Создание нового пользователя
  const newUser = new User({
    username,
    password: hashedPassword,
    firstName,
    lastName,
    age,
    gender,
    email,
    emailVerificationToken,
  });

  await newUser.save();

  // Настройка Nodemailer для отправки email
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // или используйте другой почтовый сервис
    auth: {
      user: 'your-email@gmail.com',  // Ваша почта
      pass: 'your-email-password',   // Ваш пароль
    },
  });

  // Письмо с ссылкой для подтверждения email
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Welcome to the Portfolio Platform',
    text: `Hello ${firstName},\n\nPlease confirm your email by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=${emailVerificationToken}`,
  };

  // Отправка письма
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error sending confirmation email');
    }
    console.log('Confirmation email sent: ' + info.response);
  });

  // Перенаправление на страницу логина
  res.redirect('/login');
};

// Подтверждение email с токеном
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  // Поиск пользователя по токену подтверждения
  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) {
    return res.status(400).send('Invalid or expired token');
  }

  // Подтверждаем email и удаляем токен
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;

  await user.save();

  res.redirect('/login');  // Перенаправление на страницу логина
};

// Включение двухфакторной аутентификации (2FA)
const enableTwoFactor = async (req, res) => {
  const user = await User.findById(req.user._id);  // Предполагается, что user.id в сессии

  const secret = speakeasy.generateSecret();
  user.twoFactorSecret = secret.base32;

  await user.save();

  // Возвращаем URL для настройки 2FA (считывание через приложение-аутентификатор)
  res.json({
    message: '2FA enabled',
    url: secret.otpauth_url,
  });
};

// Логин пользователя с проверкой пароля и 2FA
const loginUser = async (req, res) => {
  const { username, password, token } = req.body;

  // Поиск пользователя по имени
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('User not found');
  }

  // Проверка пароля
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).send('Invalid password');
  }

  // Проверка 2FA, если оно включено
  if (user.twoFactorEnabled) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
    });

    if (!verified) {
      return res.status(400).send('Invalid 2FA token');
    }
  }

  // Успешный логин, перенаправление на главную страницу
  res.redirect('/home');
};

module.exports = {
  registerUser,
  verifyEmail,
  enableTwoFactor,
  loginUser,
};
