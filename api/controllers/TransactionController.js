/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  create: async function (req, res) {
    try {
      const { amount, type, account, note } = req.body;
      const userId = req.session.user.id;

      if (!amount || !type || !account) {
        return res.redirect("/dashboard");
      }

      // create transaction
      const tx = await Transaction.create({
        amount: Number(amount),
        type,
        note,
        account,
        user: userId,
      }).fetch();

      // update account balance
      const acc = await Account.findOne({ id: account, user: userId });

      if (acc) {
        let newBalance = acc.balance;

        if (type === "income") newBalance += tx.amount;
        else newBalance -= tx.amount;

        await Account.updateOne({ id: acc.id }).set({ balance: newBalance });
      }

      return res.redirect("/dashboard");
    } catch (err) {
      return res.serverError(err);
    }
  },

  history: async function (req, res) {
    try {
      const user = req.session.user || req.user;

      if (!user) {
        return res.redirect("/login");
      }

      const transactions = await Transaction.find({
        user: user.id,
      })
        .sort("date DESC")
        .populate("account");

      return res.view("pages/transactions-history", {
        transactions,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },
  delete: async function (req, res) {
    const user = req.session.user || req.user;
    if (!user) return res.redirect("/login");

    const { id } = req.body;

    const tx = await Transaction.findOne({ id, user: user.id });
    if (!tx) return res.redirect("/transactions");

    const acc = await Account.findOne({ id: tx.account, user: user.id });

    if (acc) {
      let newBalance = acc.balance;

      // reverse the effect of this transaction
      if (tx.type === "income") newBalance -= tx.amount;
      else newBalance += tx.amount;

      await Account.updateOne({ id: acc.id }).set({ balance: newBalance });
    }

    await Transaction.destroyOne({ id });

    return res.redirect("/transactions");
  },

  update: async function (req, res) {
    const user = req.session.user || req.user;
    if (!user) return res.redirect("/login");

    const { id, amount, type } = req.body;

    const tx = await Transaction.findOne({ id, user: user.id });
    if (!tx) return res.redirect("/transactions");

    const acc = await Account.findOne({ id: tx.account, user: user.id });
    if (!acc) return res.redirect("/transactions");

    let balance = acc.balance;

    // remove old effect
    if (tx.type === "income") balance -= tx.amount;
    else balance += tx.amount;

    // apply new effect
    const newAmount = Number(amount);

    if (type === "income") balance += newAmount;
    else balance -= newAmount;

    await Account.updateOne({ id: acc.id }).set({ balance });

    await Transaction.updateOne({ id }).set({
      amount: newAmount,
      type,
    });

    return res.redirect("/transactions");
  },
};
