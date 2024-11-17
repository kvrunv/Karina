const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  age: Number,
  gender: String,
  email: String,
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' }, // Добавляем роль
  twoFactorSecret: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
