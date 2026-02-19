/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    amount: {
      type: 'number',
      required: true
    },

    type: {
      type: 'string',
      isIn: ['income','expense'],
      required: true
    },

    note: {
      type: 'string'
    },

    date: {
      type: 'ref',
      columnType: 'datetime',
      defaultsTo: new Date()
    },

    account: {
      model: 'account',
      required: true
    },

    user: {
      model: 'user',
      required: true
    }

  },

};

