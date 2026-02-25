/**
 * Transaction.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    amount: {
      type: "number",
      required: true,
    },

    type: {
      type: "string",
      isIn: ["income", "expense", "transfer"],
      required: true,
    },

    note: {
      type: "string",
    },

    isDeleted: {
      type: "boolean",
      defaultsTo: false,
    },

    fromAccount: { model: "account", required: true },
    toAccount: { model: "account" },

    user: {
      model: "user",
      required: true,
    },
  },
};
