/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

const { policies } = require("./policies");

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  'GET /': {view: 'pages/signup',},

  'POST /signup': 'AuthController.signup',
  'GET /signup': { view: 'pages/signup' },
  'POST /login': 'AuthController.login',
  'POST /logout': 'AuthController.logout',
  'GET /login': { view: 'pages/login' },
  'GET /dashboard': {
    action: 'dashboard/index',
    policy: 'isLoggedIn'
  },



};
