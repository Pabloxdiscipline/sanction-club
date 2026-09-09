INSERT INTO events (slug, nom, ville, max_participants)
VALUES ('sanction-club-paris-001', 'Sanction Club Paris #001', 'Paris', 30)
ON CONFLICT (slug) DO NOTHING;

-- Une fois le lieu, l'heure et le groupe WhatsApp confirmes, mets a jour la ligne :
-- UPDATE events SET date = '2026-10-04 09:00:00+02', whatsapp_link = 'https://chat.whatsapp.com/xxxxxxxx'
-- WHERE slug = 'sanction-club-paris-001';
