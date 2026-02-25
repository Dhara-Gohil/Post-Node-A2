module.exports = {


  // GET ALL ACCOUNTS FOR USER
  list: async function (req, res) {
    try {
      const userId = req.session.user.id;

      // Fetch all accounts belonging to the logged-in user
      const accounts = await Account.find({
        user: userId,
      });

      // Render accounts page with user accounts
      return res.view("pages/accounts", {
        accounts,
      });

    } catch (err) {
      return res.serverError(err);
    }
  },


  // CREATE NEW ACCOUNT

  create: async function (req, res) {
    try {
      const { name, type, balance } = req.body;

      // Validate required field
      if (!name) {
        return res.view("pages/accounts", {
          error: "Account name is required",
        });
      }

      // Create new account for logged-in user
      await Account.create({
        name,
        type: type || "cash",    // default type
        balance: balance || 0,   // default balance
        user: req.session.user.id,
      });

      return res.json({
        success: true,
        message: "Account created successfully"
      });

    } catch (err) {
      return res.serverError(err);
    }
  },



  // UPDATE ACCOUNT NAME

  update: async function (req, res) {
    try {

      const { id, name } = req.body;
      const userId = req.session.user.id;

      // Validate required fields
      if (!id || !name) {
        return res.json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Update account only if it belongs to user
      const updated = await Account.updateOne({
        id: id,
        user: userId,
      }).set({
        name: name.trim(),
      });

      // If nothing updated, log silently for debugging
      if (!updated) {
        console.log("Account update failed", id, userId);
      }

      return res.json({
        success: true,
        message: "Account updated successfully"
      });

    } catch (err) {
      console.error(err);
      return res.serverError(err);
    }
  },



  // DELETE ACCOUNT

  delete: async function (req, res) {

    const userId = req.session.user.id;
    const { id } = req.body;

    // Prevent deleting last remaining account
    const total = await Account.count({ user: userId });

    if (total <= 1) {
      console.log("Cannot delete last account");
      return res.json({
        success: false,
        message: "Cannot delete last account"
      });
    }

    // Prevent deleting account that still has transactions
    const txCount = await Transaction.count({
      account: id,
      user: userId,
    });

    if (txCount > 0) {
      console.log("Cannot delete account with transactions");
      return res.json({
        success: false,
        message: "Cannot delete account with transactions"
      });
    }

    // Safe to delete account
    await Account.destroyOne({
      id,
      user: userId,
    });

    return res.json({
      success: true,
      message: "Account deleted successfully"
    });
  },
};
