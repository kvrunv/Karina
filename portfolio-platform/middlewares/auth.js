module.exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    } else {
      res.status(403).send('Недостаточно прав');
    }
  };
  
  module.exports.isEditor = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'editor')) {
      return next();
    } else {
      res.status(403).send('Недостаточно прав');
    }
  };
  