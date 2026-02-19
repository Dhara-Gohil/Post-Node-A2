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
  'GET /accounts': {
    action: 'account/list',
    policy: 'isLoggedIn'
  },
  'POST /accounts':{
    action:'account/create',
    policy:'isLoggedIn'
  },
  'POST /transactions': {
    action: 'transaction/create',
    policy: 'isLoggedIn'
  },
  'GET /transactions': {
    action: 'transaction/history',
    policy: 'isLoggedIn'
  },
  'POST /transactions/delete': {
    action: 'transaction/delete',
    policy: 'isLoggedIn'
  },
  'POST /transactions/update': {
    action: 'transaction/update',
    policy: 'isLoggedIn'
  },
  'POST /accounts/update': {
    action: 'account/update',
    policy: 'isLoggedIn'
  },
  'POST /accounts/delete': {
    action: 'account/delete',
    policy: 'isLoggedIn'
  },

};
