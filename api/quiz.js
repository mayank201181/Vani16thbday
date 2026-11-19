// Scoreboard endpoint. The browser talks only to this function; the database
// address and key stay in Vercel environment variables and are never sent to
// the page. Each action maps to one locked-down database function.

const ACTIONS = {
  start:   (b) => ["quiz_start",   { p_name: String(b.name || "").slice(0, 60) }],
  save:    (b) => ["quiz_save",    { p_id: b.id, p_answers: b.answers, p_completed: b.completed === true }],
  results: (b) => ["quiz_results", { p_passcode: String(b.passcode || "") }],
  remove:  (b) => ["quiz_hide",    { p_passcode: String(b.passcode || ""), p_id: b.id }]
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "POST only" });

  const url = process.env.QUIZ_DB_URL;
  const key = process.env.QUIZ_DB_KEY;
  if (!url || !key) return res.status(503).json({ message: "scoreboard not configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object" || !Object.prototype.hasOwnProperty.call(ACTIONS, body.action)) {
    return res.status(400).json({ message: "unknown action" });
  }
  if ((body.action === "save" || body.action === "remove") && !UUID.test(String(body.id || ""))) {
    return res.status(400).json({ message: "bad id" });
  }
  if (body.action === "save" && (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers))) {
    return res.status(400).json({ message: "bad answers" });
  }

  const [fn, args] = ACTIONS[body.action](body);
  try {
    const r = await fetch(url + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": key, "Authorization": "Bearer " + key },
      body: JSON.stringify(args)
    });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) {}
    if (!r.ok) {
      // Pass through only the short reason, never database internals.
      const reason = data && typeof data.message === "string" ? data.message : "";
      const known = ["wrong passcode", "name required", "bad answers", "scoreboard full"];
      return res.status(known.includes(reason) ? 400 : 502).json({ message: known.includes(reason) ? reason : "scoreboard unavailable" });
    }
    if (body.action === "start") return res.status(200).json({ id: data });
    if (body.action === "results") return res.status(200).json({ rows: data || [] });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ message: "scoreboard unavailable" });
  }
};
