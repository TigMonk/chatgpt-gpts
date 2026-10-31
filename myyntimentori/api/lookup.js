import { runLookup } from "./_lib.js";

// GET /api/lookup?q=<nimi | Y-tunnus | verkko-osoite | @instagram | some-linkki>
export default async function handler(req, res) {
  const q = String(req.query?.q || "").trim().slice(0, 200);
  res.setHeader("cache-control", "no-store");
  if (req.query?.ping) return res.status(200).json({ ok: true });
  if (!q) return res.status(400).json({ error: "Anna hakusana: nimi, Y-tunnus, verkko-osoite tai @instagram" });
  try {
    res.status(200).json(await runLookup(q));
  } catch (e) {
    res.status(500).json({ error: "Haku epäonnistui: " + (e.message || e) });
  }
}
