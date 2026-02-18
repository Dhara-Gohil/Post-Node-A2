const jwt = require('jsonwebtoken');

module.exports = {

  friendlyName: 'Generate JWT',

  description: 'Create a JWT token for a user',

  inputs: {
    user: {
      type: 'ref',
      required: true
    }
  },

  fn: async function (inputs, exits) {

    const token = jwt.sign(
      { id: inputs.user.id, email: inputs.user.email },
      sails.config.custom.jwtSecret,
      { expiresIn: '1d' }
    );

    return exits.success(token);
  }

};
