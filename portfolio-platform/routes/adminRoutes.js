const express = require('express');
const router = express.Router();

// Middleware для проверки роли
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Доступ запрещен');
}

// Страница администрирования
router.get('/admin', isAdmin, (req, res) => {
  res.render('admin', { username: req.session.user.username });
});

module.exports = router;
