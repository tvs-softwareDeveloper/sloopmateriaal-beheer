// runs a .sql file (a migration or the demo data) against the database from .env.
// usage: npm run sql -- migrations/001_recycled_status.sql   or   npm run db:seed
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ quiet: true });

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.log("usage: npm run sql -- <file.sql>");
    process.exit(1);
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    // seed.sql has several statements in one file
    multipleStatements: true,
  });

  try {
    await db.query(fs.readFileSync(path.resolve(file), "utf8"));
    console.log(`done: ${file}`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.log(`FAIL: ${err.code ?? ""} ${err.message}`);
  process.exit(1);
});
