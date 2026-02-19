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

      return res.redirect("/dashboard");
    } catch (err) {
      return res.serverError(err);
    }
  },
  update: async function (req, res) {
    try {
      const user = req.session.user || req.user;
      if (!user) return res.redirect("/login");

      const { id, name } = req.body;

      if (!id || !name) {
        return res.redirect("/dashboard");
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

      return res.redirect("/dashboard");
    } catch (err) {
      console.error(err);
      return res.serverError(err);
    }
  },

  delete: async function (req, res) {
    const user = req.session.user || req.user;
    if (!user) return res.redirect("/login");

    const { id } = req.body;

    // check total accounts of user
    const total = await Account.count({ user: user.id });

    // block if this is the only account
    if (total <= 1) {
      console.log("Cannot delete last account");
      return res.redirect("/dashboard");
    }

    // check transactions
    const txCount = await Transaction.count({
      account: id,
      user: user.id,
    });

    if (txCount > 0) {
      console.log("Cannot delete account with transactions");
      return res.redirect("/dashboard");
    }

    await Account.destroyOne({
      id,
      user: user.id,
    });
    return res.redirect("/dashboard");
  },
};
