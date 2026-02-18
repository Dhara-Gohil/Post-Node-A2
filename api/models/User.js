/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true,
    },

    password: {
      type: 'string',
      required: true,
      minLength: 8,
      protect: true, // hides from queries automatically
    },
  },

};
