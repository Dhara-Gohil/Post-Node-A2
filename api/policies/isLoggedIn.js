const jwt = require('jsonwebtoken');

module.exports = function (req, res, proceed) {

  // ✅ SESSION CHECK
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return proceed();
  }

  // ✅ JWT COOKIE CHECK
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(
        req.cookies.token,
        sails.config.custom.jwtSecret
      );

      req.user = decoded;
      return proceed();

    } catch (err) {
      // token invalid → continue to block below
    }
  }

  // ❌ If neither session nor valid JWT
  return res.redirect('/login');
};
