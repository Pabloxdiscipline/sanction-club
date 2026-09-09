import { withClient, normalizeEmail, normalizeInstagram } from "./_db.js";

const EVENT_SLUG = "sanction-club-paris-001";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Methode non autorisee." });
  }

  const body = req.body || {};
  const type = body.type === "interesse" ? "interesse" : "participant";
  const prenom = String(body.prenom || "").trim();
  const email = normalizeEmail(body.email);
  const instagram = normalizeInstagram(body.instagram);
  const participate = body.participate === true;

  if (!prenom || !email || !instagram) {
    return res.status(400).json({ error: "Prenom, Instagram et email sont obligatoires." });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Email invalide." });
  }
  if (type === "participant" && !participate) {
    return res.status(400).json({ error: "Merci de confirmer ta participation pour valider l'inscription." });
  }

  try {
    const outcome = await withClient(async (client) => {
      await client.query("BEGIN");
      try {
        // Lock the event row for participant signups so the confirmed count
        // used to decide CONFIRME vs WAITLIST can't race with another signup.
        const lockClause = type === "participant" ? "FOR UPDATE" : "";
        const eventResult = await client.query(
          `SELECT id, max_participants, whatsapp_link FROM events WHERE slug = $1 ${lockClause}`,
          [EVENT_SLUG]
        );
        const event = eventResult.rows[0];
        if (!event) {
          await client.query("ROLLBACK");
          return { code: "NOT_FOUND" };
        }

        const dupResult = await client.query(
          `SELECT id FROM registrations WHERE event_id = $1 AND (email = $2 OR instagram = $3) LIMIT 1`,
          [event.id, email, instagram]
        );
        if (dupResult.rows.length > 0) {
          await client.query("ROLLBACK");
          return { code: "DUPLICATE" };
        }

        let statut = "CONFIRME";
        if (type === "participant") {
          const countResult = await client.query(
            `SELECT COUNT(*)::int AS count FROM registrations
             WHERE event_id = $1 AND statut = 'CONFIRME' AND type = 'participant'`,
            [event.id]
          );
          statut = countResult.rows[0].count < event.max_participants ? "CONFIRME" : "WAITLIST";
        }

        await client.query(
          `INSERT INTO registrations (event_id, prenom, instagram, email, statut, type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [event.id, prenom, instagram, email, statut, type]
        );

        await client.query("COMMIT");
        return { code: statut, whatsappLink: event.whatsapp_link };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    });

    if (outcome.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Evenement introuvable." });
    }
    if (outcome.code === "DUPLICATE") {
      return res.status(409).json({ status: "DUPLICATE", message: "Tu es deja inscrit au Sanction Club." });
    }
    if (outcome.code === "CONFIRME") {
      return res.status(201).json({ status: "CONFIRME", whatsappLink: outcome.whatsappLink || null });
    }
    return res.status(201).json({ status: outcome.code });
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({ status: "DUPLICATE", message: "Tu es deja inscrit au Sanction Club." });
    }
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
