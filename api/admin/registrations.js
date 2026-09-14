import { withClient } from "../_db.js";
import { isAdminAuthorized } from "../_auth.js";

const EVENT_SLUG = "sanction-club-paris-001";
const ALLOWED_STATUTS = ["CONFIRME", "WAITLIST", "ANNULE", "PRESENT"];

export default async function handler(req, res) {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Non autorisé." });
  }

  if (req.method === "GET") {
    const type = req.query.type === "interesse" ? "interesse" : "participant";
    const q = String(req.query.q || "").trim().toLowerCase();

    try {
      const data = await withClient(async (client) => {
        const eventResult = await client.query("SELECT id FROM events WHERE slug = $1", [EVENT_SLUG]);
        const event = eventResult.rows[0];
        if (!event) return null;

        const statsResult = await client.query(
          `SELECT
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE statut = 'CONFIRME')::int AS confirmed,
             COUNT(*) FILTER (WHERE statut = 'WAITLIST')::int AS waitlist,
             COUNT(*) FILTER (WHERE statut = 'CONFIRME' AND ajoute_whatsapp = true)::int AS added_whatsapp
           FROM registrations WHERE event_id = $1 AND type = 'participant'`,
          [event.id]
        );

        const params = [event.id, type];
        let query = `SELECT id, prenom, nom, instagram, telephone, email, statut, type, ajoute_whatsapp, created_at
                      FROM registrations WHERE event_id = $1 AND type = $2`;
        if (q) {
          params.push(`%${q}%`);
          query += ` AND (LOWER(prenom) LIKE $3 OR LOWER(nom) LIKE $3 OR LOWER(instagram) LIKE $3
                           OR LOWER(email) LIKE $3 OR LOWER(telephone) LIKE $3)`;
        }
        query += " ORDER BY created_at DESC";

        const rowsResult = await client.query(query, params);
        return { stats: statsResult.rows[0], registrations: rowsResult.rows };
      });

      if (!data) return res.status(404).json({ error: "Événement introuvable." });
      return res.status(200).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  }

  if (req.method === "PATCH") {
    const { id, statut, ajoute_whatsapp } = req.body || {};
    const statutProvided = statut !== undefined;
    const ajouteWhatsappProvided = ajoute_whatsapp !== undefined;

    if (
      !id ||
      (!statutProvided && !ajouteWhatsappProvided) ||
      (statutProvided && !ALLOWED_STATUTS.includes(statut)) ||
      (ajouteWhatsappProvided && typeof ajoute_whatsapp !== "boolean")
    ) {
      return res.status(400).json({ error: "Requête invalide." });
    }

    const sets = [];
    const params = [];
    if (statutProvided) {
      params.push(statut);
      sets.push(`statut = $${params.length}`);
    }
    if (ajouteWhatsappProvided) {
      params.push(ajoute_whatsapp);
      sets.push(`ajoute_whatsapp = $${params.length}`);
    }
    params.push(id);

    try {
      const result = await withClient((client) =>
        client.query(`UPDATE registrations SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`, params)
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Inscription introuvable." });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Méthode non autorisée." });
}
