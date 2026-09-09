// Applique db/schema.sql puis db/seed.sql sur la base pointee par POSTGRES_URL.
// Usage : apres `vercel env pull .env.local`, lancer `npm run migrate`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    const schema = readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
    const seed = readFileSync(path.join(__dirname, "..", "db", "seed.sql"), "utf8");
    console.log("Applying schema.sql...");
    await client.query(schema);
    console.log("Applying seed.sql...");
    await client.query(seed);
    console.log("Done.");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
