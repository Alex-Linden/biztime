"use strict";

const express = require("express");
const db = require("../db");
const router = express.Router();

const { NotFoundError, BadRequestError } = require("../expressError");

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});



/** Return obj of company:
 *  {company: {code, name, description,
 *      invoices: [id, ...]}}

If the company given cannot be found, this should return a 404 status response. */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
           FROM companies
           WHERE code = $1`,
    [code]);
  const company = results.rows[0];

  const invoicesResults = await db.query(
    `SELECT id
           FROM invoices
           WHERE comp_code = $1`,
    [code]);
  company.invoices = invoicesResults.rows.map(r => r.id);

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});


/**Adds a company.

Needs to be given JSON like: {code, name, description}

Returns obj of new company: {company: {code, name, description}} */
router.post("/", async function (req, res) {
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
    [req.body.code, req.body.name, req.body.description]);
  const company = results.rows[0];

  return res.status(201).json({ company });
});


/**Edit existing company.

Should return 404 if company cannot be found.

Needs to be given JSON like: {name, description}

Returns update company object: {company: {code, name, description}} */
router.put("/:code", async function (req, res) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
         SET name=$1, description=$2
         WHERE code = $3
         RETURNING code, name, description`,
    [req.body.name, req.body.description, code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});


/**Deletes company.

Should return 404 if company cannot be found.

Returns {status: "deleted"} */
router.delete("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(
    `DELETE FROM companies
      WHERE code = $1
      RETURNING code`, [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ status: "deleted" });
});


module.exports = router;