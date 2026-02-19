const nodemailer = require('nodemailer');

module.exports = {

  friendlyName: 'Send welcome email',

  inputs: {
    email: { type: 'string', required: true }
  },

  fn: async function (inputs, exits) {

    try {

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: sails.config.custom.mailUser,
          pass: sails.config.custom.mailPass
        }
      });

      await transporter.sendMail({
        from: `"Expense Manager" <${sails.config.custom.mailUser}>`,
        to: inputs.email,
        subject: 'Welcome to Expense Manager 🎉',
        text: 'Your account has been created successfully!'
      });

      console.log("Welcome email sent to:", inputs.email);

      return exits.success();

    } catch (err) {
      console.log("Email error:", err.message);
      return exits.success(); // never break signup
    }

  }

};
