/**
 * Account.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },

    type: {
      type: 'string',
      defaultsTo: 'cash'
    },

    balance: {
      type: 'number',
      defaultsTo: 0
    },

    user: {
      model: 'user',
      required: true
    }
  },

};

