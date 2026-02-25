/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// This controller handles creating, updating, deleting, and listing transactions.
// It also ensures that account balances are updated accordingly when transactions are modified.

module.exports = {
  create: async function (req, res) {
    try {
      const { amount, type, account, note } = req.body;
      const userId = req.session.user.id;

      if (!amount || !type || !account) {
        return res.json({ success: false, message: "Missing required fields" });
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

      return res.json({ success: true, transaction: tx });
    } catch (err) {
      return res.serverError(err);
    }
  },

  // list transaction history for the logged-in user
  history: async function (req, res) {
    try {
      const userId = req.session.user.id;

      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // build filter
      const filter = { user: userId, isDeleted: false };

      if (req.query.type) filter.type = req.query.type;
      if (req.query.account) filter.account = req.query.account;
      if (req.query.search) filter.note = { contains: req.query.search };

      const total = await Transaction.count(filter);

      const transactions = await Transaction.find(filter)
        .populate("account")
        .sort("createdAt DESC")
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return res.view("pages/transactions-history", {
        transactions,
        page,
        totalPages,
        query: req.query,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  //  delete transaction and update account balance accordingly
  delete: async function (req, res) {
    const user = req.session.user;
    if (!user) {
      return res.json({ success: false, message: "Not logged in" });
    }
    const userId = user.id;
    try {
      const userId = req.session.user.id;
      const { id } = req.body;

      const tx = await Transaction.findOne({
        id,
        user: userId,
        isDeleted: false,
      });

      if (!tx) {
        return res.json({
          success: false,
          message: "Transaction not found",
        });
      }

      const acc = await Account.findOne({
        id: tx.account,
        user: userId,
        isDeleted: false,
      });

      if (acc) {
        let newBalance = acc.balance;

        // reverse old effect
        if (tx.type === "income") newBalance -= tx.amount;
        else newBalance += tx.amount;

        await Account.updateOne({ id: acc.id }).set({ balance: newBalance });
      }

      // soft delete
      await Transaction.updateOne({ id }).set({ isDeleted: true });

      return res.json({
        success: true,
        message: "Deleted",
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  update: async function (req, res) {
    const { id, amount, type } = req.body;

    const tx = await Transaction.findOne({
      id,
      user: user.id,
      isDeleted: false,
    });
    if (!tx)
      return res.json({ success: false, message: "Transaction not found" });

    const acc = await Account.findOne({
      id: tx.account,
      user: user.id,
      isDeleted: false,
    });
    if (!acc) return res.json({ success: false, message: "Account not found" });

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

    return res.json({
      success: true,
      message: "Transaction updated successfully",
    });
  },
};
