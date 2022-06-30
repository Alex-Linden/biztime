"use strict";

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");

const db = require("../db");

let testCompany;
let testInvoiceId;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
       VALUES ('test', 'test Company', 'test description')
       RETURNING code, name, description`);
  testCompany = results.rows[0];

  const invoiceResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
         VALUES ('test', 10)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoiceId = invoiceResults.rows.map(r => r.id);

});


describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const resp = await request(app).get('/companies');
    expect(resp.body).toEqual({ companies: [{ code: 'test', name: 'test Company' }] });
  });
});

describe("GET /companies/:code", function () {
  test("Gets company", async function () {
    const resp = await request(app).get(`/companies/test`);
    testCompany.invoices = testInvoiceId;
    expect(resp.body).toEqual({ company: testCompany });
  });

  test("Respond with 404 if not found", async function () {
    const resp = await request(app).get(`/companies/vv`);
    expect(resp.statusCode).toEqual(404);
  });
});


describe("POST /companies", function () {
  test("Create new compnay", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({ code: "test2", name: "testName", description: "description" });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: { code: "test2", name: "testName", description: "description" },
    });
  });
});


describe("PUT /companies/:code", function () {
  test("Update a single company", async function () {
    const resp = await request(app)
      .put('/companies/test')
      .send({ name: "Troll", description: "Toll" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { code: "test", name: "Troll", description: "Toll" },
    });
  });

  test("Respond with 404 if nout found", async function () {
    const resp = await request(app)
      .put(`/companies/mm`)
      .send({}); //??? not in lecture notes
    expect(resp.statusCode).toEqual(404);
  });
});


describe("DELETE /companies/:code", function () {
  test("Delete single a company", async function () {
    const resp = await request(app)
      .delete('/companies/test');
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });
});





afterAll(async function () {
  await db.end();
});