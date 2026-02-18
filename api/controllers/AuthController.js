/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const bcrypt = require("bcrypt");

module.exports = {
  signup: async function (req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.view("pages/signup", {
          error: "Email and password are required",
          email,
        });
      }

      if (password.length < 8) {
        return res.view("pages/signup", {
          error: "Password must be at least 8 characters long",
          email,
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.view("pages/signup", {
          error: "Email already in use",
          email,
        });
      }

      const hashpassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        email,
        password: hashpassword,
      }).fetch();

      // auto-login after signup
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
      };

      return res.redirect("/dashboard");
    } catch (err) {
      return res.serverError(err);
    }
  },

  login: async function (req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.view("pages/login", {
          error: "Email and password required",
        });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.view("pages/login", { error: "Invalid email or password" });
      }

      const bcrypt = require("bcrypt");
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.view("pages/login", { error: "Invalid email or password" });
      }

      // save session
      req.session.user = {
        id: user.id,
        email: user.email,
      };
      const token = await sails.helpers.generateJwt({
        user: req.session.user,
      });

      // store token in cookie (optional but useful)
      res.cookie("token", token, { httpOnly: true });

      // redirect to homepage or dashboard (even if not built yet)
      return res.redirect("/dashboard");
    } catch (err) {
      return res.serverError(err);
    }
  },
  logout: async function (req, res) {
    req.session.destroy(function (err) {
      if (err) {
        return res.serverError(err);
      }
      return res.redirect("/login");
    });
  },
};
