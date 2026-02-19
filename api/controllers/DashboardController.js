/**
 * DashboardController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  index: async function (req, res) {

    // get user from session (primary source)
    const user = req.session.user;

    // if no session user, redirect to login
    if (!user) {
      return res.redirect('/login');
    }

    //fetch user accounts from database
    const accounts = await Account.find({ user: user.id });

    // calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    // render dashboard safely
    return res.view('pages/dashboard', { user, accounts, totalBalance });

  }

};






