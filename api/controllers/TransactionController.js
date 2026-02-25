/**
 * TransactionController
 *
 * Handles:
 *  - Creating transactions
 *  - Listing history with pagination/filter/search
 *  - Soft deleting transactions
 *  - Updating transactions while keeping balances consistent
 *
 * IMPORTANT RULE:
 * Account balances must ALWAYS reflect transaction history.
 * So every create/update/delete must adjust balances.
 */

module.exports = {

  /**
   * CREATE TRANSACTION
   *
   * Creates transaction record and immediately updates account balances.
   * Supports:
   *  - income  → adds to account
   *  - expense → subtracts from account
   *  - transfer → move money between accounts
   */
  create: async function (req, res) {
    try {
      const userId = req.session.user.id;
      const { amount, type, fromAccount, toAccount, note } = req.body;

      // Validate required inputs
      if (!amount || !type || !fromAccount) {
        return res.json({ success: false, message: "Missing fields" });
      }

      const amt = Number(amount);

      // Save transaction first (source of truth)
      const tx = await Transaction.create({
        amount: amt,
        type,
        note,
        fromAccount,
        toAccount: toAccount || null,
        user: userId,
      }).fetch();

      // Fetch source account to adjust balance
      const source = await Account.findOne({ id: fromAccount, user: userId });
      if (!source) return res.json({ success: false });

      // Apply balance logic based on transaction type
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

        // subtract from source
        await Account.updateOne({ id: source.id }).set({
          balance: source.balance - amt,
        });

        // add to destination
        await Account.updateOne({ id: dest.id }).set({
          balance: dest.balance + amt,
        });
      }

      return res.json({ success: true });

    } catch (err) {
      return res.serverError(err);
    }
  },


  /**
   * TRANSACTION HISTORY
   *
   * Provides:
   *  - pagination
   *  - filtering by type
   *  - filtering by account
   *  - search in notes
   */
  history: async function (req, res) {
    try {
      const userId = req.session.user.id;

      // pagination calculations
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // build dynamic filter object
      const filter = { user: userId, isDeleted: false };

      // filter by type
      if (req.query.type) filter.type = req.query.type;

      // filter by account (works for transfers too)
      if (req.query.account) {
        filter.or = [
          { fromAccount: req.query.account },
          { toAccount: req.query.account },
        ];
      }

      // search inside note text
      if (req.query.search) filter.note = { contains: req.query.search };

      const total = await Transaction.count(filter);

      // fetch paginated transactions
      const transactions = await Transaction.find(filter)
        .populate("fromAccount")
        .populate("toAccount")
        .sort("createdAt DESC")
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      // fetch accounts for dropdown filters in UI
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


  /**
   * DELETE TRANSACTION (SOFT DELETE)
   *
   * Instead of removing from DB:
   *  - mark isDeleted=true
   *  - reverse balance effect
   *
   * This keeps history intact and prevents financial inconsistency.
   */
  delete: async function (req, res) {
    try {
      const userId = req.session.user.id;
      const { id } = req.body;

      const tx = await Transaction.findOne({
        id,
        user: userId,
        isDeleted: false,
      });

      if (!tx) {
        return res.json({ success: false, message: "Transaction not found" });
      }

      // reverse previous balance effect
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
        const from = await Account.findOne({ id: tx.fromAccount, user: userId });
        const to = await Account.findOne({ id: tx.toAccount, user: userId });

        if (from)
          await Account.updateOne({ id: from.id }).set({
            balance: from.balance + tx.amount,
          });

        if (to)
          await Account.updateOne({ id: to.id }).set({
            balance: to.balance - tx.amount,
          });
      }

      // mark as deleted instead of removing
      await Transaction.updateOne({ id }).set({ isDeleted: true });

      return res.json({ success: true, message: "Deleted" });

    } catch (err) {
      return res.serverError(err);
    }
  },


  /**
   * UPDATE TRANSACTION
   *
   * SAFETY LOGIC:
   * 1. Reverse old balance impact
   * 2. Apply new balance impact
   * 3. Update record
   *
   * This prevents balance drift.
   */
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

      // ---- reverse old balances ----
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
        const from = await Account.findOne({ id: tx.fromAccount, user: userId });
        const to = await Account.findOne({ id: tx.toAccount, user: userId });

        if (from)
          await Account.updateOne({ id: from.id }).set({
            balance: from.balance + tx.amount,
          });

        if (to)
          await Account.updateOne({ id: to.id }).set({
            balance: to.balance - tx.amount,
          });
      }

      // ---- apply new balances ----
      if (type === "income") {
        const acc = await Account.findOne({ id: fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance + newAmount,
          });

      } else if (type === "expense") {
        const acc = await Account.findOne({ id: fromAccount, user: userId });
        if (acc)
          await Account.updateOne({ id: acc.id }).set({
            balance: acc.balance - newAmount,
          });

      } else if (type === "transfer") {
        const from = await Account.findOne({ id: fromAccount, user: userId });
        const to = await Account.findOne({ id: toAccount, user: userId });

        if (from)
          await Account.updateOne({ id: from.id }).set({
            balance: from.balance - newAmount,
          });

        if (to)
          await Account.updateOne({ id: to.id }).set({
            balance: to.balance + newAmount,
          });
      }

      // update transaction record itself
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
