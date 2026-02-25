module.exports = {
  list: async function (req, res) {
    try {
      const userId = req.session.user.id;

      const accounts = await Account.find({
        user: userId,
      });

      return res.view("pages/accounts", {
        accounts,
      });
    } catch (err) {
      return res.serverError(err);
    }
  },

  create: async function (req, res) {
    try {
      const { name, type, balance } = req.body;

      if (!name) {
        return res.view("pages/accounts", {
          error: "Account name is required",
        });
      }
      await Account.create({
        name,
        type: type || "cash",
        balance: balance || 0,
        user: req.session.user.id,
      });

      return res.json({ success: true, message: "Account created successfully" });
    } catch (err) {
      return res.serverError(err);
    }
  },
  update: async function (req, res) {
    try {

      const { id, name } = req.body;

      if (!id || !name) {
        return res.json({success: false, message: "Missing required fields"});

      }

      const updated = await Account.updateOne({
        id: id,
        user: user.id,
      }).set({
        name: name.trim(),
      });

      // if update fails silently, log it
      if (!updated) {
        console.log("Account update failed", id, user.id);
      }

      return res.json({ success: true, message: "Account updated successfully" });
    } catch (err) {
      console.error(err);
      return res.serverError(err);
    }
  },

  delete: async function (req, res) {

    const { id } = req.body;

    // check total accounts of user
    const total = await Account.count({ user: req.session.user.id });

    // block if this is the only account
    if (total <= 1) {
      console.log("Cannot delete last account");
      return res.json({success: false, message: "Cannot delete last account"});

    }

    // check transactions
    const txCount = await Transaction.count({
      account: id,
      user: user.id,
    });

    if (txCount > 0) {
      console.log("Cannot delete account with transactions");
      return res.json({success: false, message: "Cannot delete account with transactions"});
    }

    await Account.destroyOne({
      id,
      user: user.id,
    });
    return res.json({ success: true, message: "Account deleted successfully" });
  },
};
