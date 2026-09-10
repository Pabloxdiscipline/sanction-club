import { withClient } from "./_db.js";

const EVENT_SLUG = "sanction-club-paris-001";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const event = await withClient(async (client) => {
      const { rows } = await client.query(
        `SELECT e.nom, e.ville, e.max_participants,
                (SELECT COUNT(*)::int FROM registrations r
                  WHERE r.event_id = e.id AND r.statut = 'CONFIRME' AND r.type = 'participant') AS confirmed_count
         FROM events e WHERE e.slug = $1`,
        [EVENT_SLUG]
      );
      return rows[0];
    });

    if (!event) {
      return res.status(404).json({ error: "Événement introuvable." });
    }

    const confirmed = Number(event.confirmed_count);
    const max = Number(event.max_participants);

    return res.status(200).json({
      nom: event.nom,
      ville: event.ville,
      confirmed,
      max,
      full: confirmed >= max,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
