const PortfolioItem = require('../models/PortfolioItem');

// Создание элемента портфолио
const createPortfolioItem = async (req, res) => {
  const { title, description, images } = req.body;
  const newItem = new PortfolioItem({ title, description, images });
  await newItem.save();
  res.redirect('/portfolio');
};

// Обновление элемента портфолио
const updatePortfolioItem = async (req, res) => {
  const { id } = req.params;
  const { title, description, images } = req.body;
  const updatedItem = await PortfolioItem.findByIdAndUpdate(id, {
    title,
    description,
    images,
    updatedAt: Date.now(),
  }, { new: true });
  res.redirect('/portfolio');
};

// Удаление элемента портфолио
const deletePortfolioItem = async (req, res) => {
  const { id } = req.params;
  await PortfolioItem.findByIdAndDelete(id);
  res.redirect('/portfolio');
};

// Получение всех элементов портфолио
const getPortfolioItems = async (req, res) => {
  const items = await PortfolioItem.find();
  res.render('portfolio', { items });
};

module.exports = { createPortfolioItem, updatePortfolioItem, deletePortfolioItem, getPortfolioItems };
