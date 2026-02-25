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
      const userId = req.session.user.id;
      const { amount, type, fromAccount, toAccount, note } = req.body;

      if (!amount || !type || !fromAccount) {
        return res.json({ success: false, message: "Missing fields" });
      }

      const amt = Number(amount);

      const tx = await Transaction.create({
        amount: amt,
        type,
        note,
        fromAccount,
        toAccount: toAccount || null,
        user: userId,
      }).fetch();

      const source = await Account.findOne({ id: fromAccount, user: userId });
      if (!source) return res.json({ success: false });

      if (type === "income") {
        await Account.updateOne({ id: source.id }).set({
          balance: source.balance + amt,
        });
      } else if (type === "expense") {
        await Account.updateOne({ id: source.id }).set({
          balance: source.balance - amt,
        });
      } else if (type === "transfer") {
        const dest = await Account.findOne({ id: toAccount, user: userId });
        if (!dest)
          return res.json({ success: false, message: "Destination missing" });

        await Account.updateOne({ id: source.id }).set({
          balance: source.balance - amt,
        });

        await Account.updateOne({ id: dest.id }).set({
          balance: dest.balance + amt,
        });
      }

      return res.json({ success: true });
    } catch (err) {
      return res.serverError(err);
    }
  },

  // list transaction history for the logged-in user
  history: async function (req, res) {
    try {
      const userId = req.session.user.id;

      // for pagination
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // build filter
      const filter = { user: userId, isDeleted: false };

      if (req.query.type) filter.type = req.query.type;
      if (req.query.account) {
        filter.or = [
          { fromAccount: req.query.account },
          { toAccount: req.query.account },
        ];
      }

      if (req.query.search) filter.note = { contains: req.query.search };

      const total = await Transaction.count(filter);

      const transactions = await Transaction.find(filter)
        .populate("fromAccount")
        .populate("toAccount")
        .sort("createdAt DESC")
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);
      const accounts = await Account.find({
        user: userId,
        isDeleted: false,
      });

      return res.view("pages/transactions-history", {
        transactions,
        page,
        totalPages,
        query: req.query,
        accounts,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  //  delete transaction and update account balance accordingly
  delete: async function (req, res) {
    try {
      const user = req.session.user;
      if (!user) {
        return res.json({ success: false, message: "Not logged in" });
      }

      const userId = user.id;
      const { id } = req.body;

      const tx = await Transaction.findOne({
        id,
        user: userId,
        isDeleted: false,
      });

      if (!tx) {
        return res.json({ success: false, message: "Transaction not found" });
      }

      // ===== HANDLE BALANCE REVERSAL =====

      if (tx.type === "income") {
        const acc = await Account.findOne({ id: tx.fromAccount, user: userId });
        if (acc) {
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance - tx.amount,
          });
        }
      } else if (tx.type === "expense") {
        const acc = await Account.findOne({ id: tx.fromAccount, user: userId });
        if (acc) {
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance + tx.amount,
          });
        }
      } else if (tx.type === "transfer") {
        const from = await Account.findOne({
          id: tx.fromAccount,
          user: userId,
        });
        const to = await Account.findOne({ id: tx.toAccount, user: userId });

        if (from) {
          await Account.updateOne({ id: from.id }).set({
            balance: from.balance + tx.amount,
          });
        }

        if (to) {
          await Account.updateOne({ id: to.id }).set({
            balance: to.balance - tx.amount,
          });
        }
      }

      // soft delete transaction
      await Transaction.updateOne({ id }).set({ isDeleted: true });

      return res.json({ success: true, message: "Deleted" });
    } catch (err) {
      return res.serverError(err);
    }
  },
  update: async function (req, res) {
    try {
      const userId = req.session.user.id;
      const { id, amount, type, fromAccount, toAccount } = req.body;
      const newAmount = Number(amount);

      const tx = await Transaction.findOne({
        id,
        user: userId,
        isDeleted: false,
      });
      if (!tx)
        return res.json({ success: false, message: "Transaction not found" });

      //  REVERSE OLD BALANCE

      if (tx.type === "income") {
        const acc = await Account.findOne({ id: tx.fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance - tx.amount,
          });
      } else if (tx.type === "expense") {
        const acc = await Account.findOne({ id: tx.fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance + tx.amount,
          });
      } else if (tx.type === "transfer") {
        const from = await Account.findOne({
          id: tx.fromAccount,
          user: userId,
        });
        const to = await Account.findOne({ id: tx.toAccount, user: userId });

        if (from)
          await Account.updateOne({ id: from.id, user: userId }).set({
            balance: from.balance + tx.amount,
          });

        if (to)
          await Account.updateOne({ id: to.id, user: userId }).set({
            balance: to.balance - tx.amount,
          });
      }

      //  APPLY NEW BALANCE

      if (type === "income") {
        const acc = await Account.findOne({ id: fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id, user: userId }).set({
            balance: acc.balance + newAmount,
          });
      } else if (type === "expense") {
        const acc = await Account.findOne({ id: fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id, user: userId }).set({
            balance: acc.balance - newAmount,
          });
      } else if (type === "transfer") {
        const from = await Account.findOne({ id: fromAccount, user: userId });
        const to = await Account.findOne({ id: toAccount, user: userId });

        if (from)
          await Account.updateOne({ id: from.id, user: userId }).set({
            balance: from.balance - newAmount,
          });

        if (to)
          await Account.updateOne({ id: to.id, user: userId }).set({
            balance: to.balance + newAmount,
          });
      }

      //UPDATE TRANSACTION RECORD

      await Transaction.updateOne({ id }).set({
        amount: newAmount,
        type,
        fromAccount,
        toAccount: toAccount || null,
      });

      return res.json({ success: true });
    } catch (err) {
      return res.serverError(err);
    }
  },
};
