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

    // render dashboard safely
    return res.view('pages/dashboard', { user });

  }

};






