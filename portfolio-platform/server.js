const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes'); // Импорт маршрутов аутентификации
const portfolioRoutes = require('./routes/portfolioRoutes');
const adminRoutes = require('./routes/adminRoutes');
const User = require('./models/User');

const app = express();

// Подключение к базе данных MongoDB
mongoose.connect('mongodb://localhost:27017/portfolioPlatform')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));


// Статические файлы
app.use(express.static('public'));

// Middleware для работы с сессиями
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }  // Отключаем secure cookie для локальной разработки
}));

// Middleware для работы с формами
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Устанавливаем EJS как шаблонизатор
app.set('view engine', 'ejs');

// Подключение маршрутов
app.use(authRoutes); // Подключаем маршруты аутентификации
app.use(portfolioRoutes);
app.use(adminRoutes);

// Главная страница
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/portfolio');
  } else {
    res.redirect('/login');
  }
});

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
