# Expense Manager (Sails.js)

A web-based Expense Manager built using **Node.js + Sails.js + MongoDB + EJS** that allows users to manage accounts, track income/expenses, and transfer money between accounts.

---

## Features Implemented

### Authentication

* User signup with password validation
* Login & logout using session auth
* Welcome email on signup (Nodemailer)

### Accounts

* Default account created on signup
* Create new accounts
* Rename account
* Delete account (with safeguards)
* Total balance calculation

### Transactions

* Add Income / Expense / Transfer
* Update transaction
* Soft delete transaction (no permanent data loss)
* Automatic balance updates on create/update/delete

### Transaction History

* Pagination
* Search by note
* Filter by type
* Ordered by latest transaction first

---

## Tech Stack

* Backend: **Sails.js**
* Database: **MongoDB**
* Templating: **EJS**
* Auth: **Sessions + JWT ready**
* Mail: **Nodemailer**

---

## Project Structure

* `api/controllers` → Business logic
* `api/models` → DB schema
* `config/routes.js` → Route mapping
* `views/pages` → UI pages
* `assets/styles` → CSS

---

## How to Run

```bash
npm install
sails lift
```

App runs on:

```
http://localhost:1337
```

---

