import { withClient } from "../_db.js";
import { isAdminAuthorized } from "../_auth.js";

const EVENT_SLUG = "sanction-club-paris-001";

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function handler(req, res) {
  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Non autorisé." });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const rows = await withClient(async (client) => {
      const eventResult = await client.query("SELECT id FROM events WHERE slug = $1", [EVENT_SLUG]);
      const event = eventResult.rows[0];
      if (!event) return null;
      const result = await client.query(
        `SELECT prenom, nom, instagram, telephone, email, consentement_image, statut, type, created_at
         FROM registrations WHERE event_id = $1 ORDER BY created_at ASC`,
        [event.id]
      );
      return result.rows;
    });

    if (!rows) return res.status(404).json({ error: "Événement introuvable." });

    const header = ["Prénom", "Nom", "Instagram", "Téléphone", "Email", "Consentement image", "Statut", "Type", "Date inscription"];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        [
          csvEscape(row.prenom),
          csvEscape(row.nom),
          csvEscape(row.instagram),
          csvEscape(row.telephone),
          csvEscape(row.email),
          csvEscape(row.consentement_image ? "Oui" : "Non"),
          csvEscape(row.statut),
          csvEscape(row.type),
          csvEscape(new Date(row.created_at).toISOString()),
        ].join(",")
      );
    }
    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="sanction-club-inscriptions.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
