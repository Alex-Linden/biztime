"use strict";
const express = require("express");
const db = require("../db");
const router = express.Router();

const { NotFoundError } = require("../expressError");

/** Return info on invoices: like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices`);
  const invoices = results.rows;
  return res.json({ invoices });
});


/** Returns obj on given invoice.

If invoice cannot be found, returns 404.

Returns {invoice: {id, amt, paid, add_date, paid_date,
            company: {code, name, description}} */
router.get("/:id", async function (req, res) {
  const id = parseInt(req.params.id);
  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code AS company
           FROM invoices
           WHERE id = $1`,
    [id]);

  const invoice = invoiceResults.rows[0];

  const companyResults = await db.query(
    `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
    [invoice.company]);

  invoice.company = companyResults.rows[0];

  if (!invoice) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ invoice });
});


/**Adds an invoice.

Needs to be passed in JSON body of: {comp_code, amt}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
or 404 code if no company exists */
router.post("/", async function (req, res) {
  const code = req.body.comp_code;
  const companyResults = await db.query(
    `SELECT code
           FROM companies
           WHERE code = $1`,
    [code]);
  if (!companyResults.rows[0]) throw new NotFoundError(`No matching company: ${code}`);

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [code, Number(req.body.amt)]);
  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/**Updates an invoice.

If invoice cannot be found, returns a 404.

Needs to be passed in a JSON body of {amt, paid}

Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} */
router.put("/:id", async function (req, res) {
  if ("id" in req.body) throw new BadRequestError("Not allowed");
  let paidStatus = `paid = false, paid_date = null`;

  const id = parseInt(req.params.id);
  const date = new Date();
  if (req.body.paid) {
    paidStatus = `paid=true, paid_date=CURRENT_DATE`
  }

  const results = await db.query(
    `UPDATE invoices
         SET amt=$2, ${paidStatus}
         WHERE id = $1
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [id, Number(req.body.amt)]);

  const invoice = results.rows[0];



  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.json({ invoice });
});


/**Deletes an invoice.

If invoice cannot be found, returns a 404.

Returns: {status: "deleted"} */

router.delete("/:id", async function (req, res) {
  const id = parseInt(req.params.id);
  const results = await db.query(
    `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`, [id]);
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching company: ${id}`);
  return res.json({ status: "deleted" });
});



module.exports = router;