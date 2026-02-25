/**
 * AuthController
 *
 * Handles authentication:
 *  - Signup (with validation + default account + welcome email)
 *  - Login (with password verification + JWT + session)
 *  - Logout (destroy session)
 */

const bcrypt = require("bcrypt");

module.exports = {
  // USER SIGNUP

  signup: async function (req, res) {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.view("pages/signup", {
          error: "Email and password are required",
          email,
        });
      }

      // Enforce minimum password length
      if (password.length < 8) {
        return res.view("pages/signup", {
          error: "Password must be at least 8 characters long",
          email,
        });
      }

      // Prevent duplicate accounts
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.view("pages/signup", {
          error: "Email already in use",
          email,
        });
      }

      // Hash password before storing (never store plain passwords)
      const hashpassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await User.create({
        email,
        password: hashpassword,
      }).fetch();

      // Automatically create a default account for new users
      await Account.create({
        name: "Default Account",
        type: "cash",
        balance: 0,
        user: newUser.id,
      });

      // Send welcome email (non-blocking business logic)
      await sails.helpers.sendWelcomeEmail.with({
        email: newUser.email,
      });

      // Auto-login user after signup (improves UX)
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
      };

      // Return JSON instead of redirect (frontend handles navigation)
      return res.json({
        success: true,
        message: "Signup successful",
        user: req.session.user,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  // USER LOGIN
  login: async function (req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.view("pages/login", {
          error: "Email and password required",
        });
      }

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.view("pages/login", {
          error: "Invalid email or password",
        });
      }

      // Compare hashed password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.view("pages/login", {
          error: "Invalid email or password",
        });
      }

      // Store session for server-side authentication
      req.session.user = {
        id: user.id,
        email: user.email,
      };

      // Generate JWT for API authentication / future mobile clients
      const token = await sails.helpers.generateJwt({
        user: req.session.user,
      });

      // Store JWT in secure httpOnly cookie (prevents JS access)
      res.cookie("token", token, { httpOnly: true });

      // NOTE:
      // Ideally frontend should handle redirect after JSON response,
      // but keeping redirect here for now since views depend on it.
      return res.redirect("/dashboard");
    } catch (err) {
      return res.serverError(err);
    }
  },

  // USER LOGOUT
  logout: async function (req, res) {
    // Destroy session to fully log out user
    req.session.destroy(function (err) {
      if (err) {
        return res.serverError(err);
      }

      // Redirect to login after logout
      return res.redirect("/login");
    });
  },
};
