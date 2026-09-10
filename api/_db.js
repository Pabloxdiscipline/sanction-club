import pg from "pg";

const { Pool } = pg;

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function withClient(fn) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeInstagram(handle) {
  return String(handle || "").trim().toLowerCase().replace(/^@+/, "");
}

export function normalizeTelephone(phone) {
  return String(phone || "").trim();
}

// Convertit une chaine vide en null pour les colonnes optionnelles : evite
// que deux inscriptions "interesse" sans instagram se percutent sur la
// contrainte UNIQUE(event_id, instagram) via deux chaines vides identiques.
export function orNull(value) {
  return value ? value : null;
}
