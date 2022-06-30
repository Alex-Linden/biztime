"use strict";
/** Database setup for BizTime. */

const { Client } = require("pg");

// MAC SET UP
// const DB_URI = process.env.NODE_ENV === "test"
//     ? "postgresql:///biztime_test"
//     : "postgresql:///biztime";

//LINUX SET UP
const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql://robinnsheen:pgpassword@localhost/biztime_test"
    : "postgresql://robinnsheen:pgpassword@localhost/biztime";

let db = new Client({
  connectionString: DB_URI
});

db.connect();

module.exports = db;