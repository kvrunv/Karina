const express = require('express');
const PortfolioItem = require('../models/PortfolioItem');
const { isAdmin, isEditor } = require('../middlewares/auth');
const router = express.Router();

// Middleware для проверки авторизации
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login'); // Перенаправление на страницу логина
}

// Страница с портфолио
router.get('/portfolio', ensureAuthenticated, async (req, res) => {
  try {
    const portfolioItems = await PortfolioItem.find({ deletedAt: null });
    res.render('portfolio', {
      portfolioItems,
      username: req.session.user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при загрузке портфолио');
  }
});

// Создание нового элемента портфолио (доступно редактору и администратору)
router.post('/portfolio', ensureAuthenticated, isEditor, async (req, res) => {
  const { title, description, images } = req.body;

  if (!title || !description || !images || images.length === 0) {
    return res.status(400).send('Ошибка: все поля обязательны и должно быть хотя бы одно изображение');
  }

  const imageArray = images.slice(0, 3).map(img => ({
    url: img.url,
    alt: img.alt
  }));

  const newPortfolioItem = new PortfolioItem({
    title,
    description,
    images: imageArray
  });

  try {
    await newPortfolioItem.save();
    res.redirect('/portfolio');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при создании элемента портфолио');
  }
});

// Обновление фотографий (только для администраторов)
router.put('/portfolio/:id', ensureAuthenticated, isAdmin, async (req, res) => {
  const { title, description, images } = req.body;

  try {
    const portfolioItem = await PortfolioItem.findById(req.params.id);
    if (!portfolioItem) {
      return res.status(404).send('Портфолио не найдено');
    }

    portfolioItem.title = title || portfolioItem.title;
    portfolioItem.description = description || portfolioItem.description;

    if (images) {
      portfolioItem.images = images.slice(0, 3).map(img => ({
        url: img.url,
        alt: img.alt
      }));
    }

    portfolioItem.updatedAt = Date.now();
    await portfolioItem.save();
    res.redirect('/portfolio');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при обновлении элемента портфолио');
  }
});

// Удаление фотографии (только для администраторов)
router.delete('/portfolio/:id', ensureAuthenticated, isAdmin, async (req, res) => {
  try {
    const portfolioItem = await PortfolioItem.findById(req.params.id);
    if (!portfolioItem) {
      return res.status(404).send('Портфолио не найдено');
    }

    portfolioItem.deletedAt = Date.now();
    await portfolioItem.save();
    res.redirect('/portfolio');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при удалении элемента портфолио');
  }
});

module.exports = router;
