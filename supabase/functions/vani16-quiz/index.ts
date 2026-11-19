// Scoreboard endpoint for the Sweet 16 quiz.
// Anonymous players reach this through the quiz site, so it takes no login.
// It can do exactly four things, each mapped to one locked-down database
// function; reading or removing results needs the scoreboard passcode,
// which is checked inside the database.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN = ["wrong passcode", "name required", "bad answers", "scoreboard full"];

type Body = Record<string, unknown>;

const ACTIONS: Record<string, (b: Body) => [string, Body]> = {
  start: (b) => ["quiz_start", { p_name: String(b.name ?? "").slice(0, 60) }],
  save: (b) => ["quiz_save", { p_id: b.id, p_answers: b.answers, p_completed: b.completed === true }],
  results: (b) => ["quiz_results", { p_passcode: String(b.passcode ?? "") }],
  remove: (b) => ["quiz_hide", { p_passcode: String(b.passcode ?? ""), p_id: b.id }],
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { message: "POST only" });

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return json(503, { message: "scoreboard not configured" });

  let body: Body | null = null;
  try {
    const text = await req.text();
    if (text.length > 4000) return json(400, { message: "too large" });
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch (_e) {
    body = null;
  }
  const action = body ? String(body.action ?? "") : "";
  if (!body || !Object.prototype.hasOwnProperty.call(ACTIONS, action)) {
    return json(400, { message: "unknown action" });
  }
  if ((action === "save" || action === "remove") && !UUID.test(String(body.id ?? ""))) {
    return json(400, { message: "bad id" });
  }
  if (action === "save" && (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers))) {
    return json(400, { message: "bad answers" });
  }

  const [fn, args] = ACTIONS[action](body);
  try {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify(args),
    });
    const text = await r.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_e) {
      data = null;
    }
    if (!r.ok) {
      // Pass through only the short reason, never database internals.
      const reason = data && typeof (data as Body).message === "string" ? String((data as Body).message) : "";
      return KNOWN.includes(reason)
        ? json(400, { message: reason })
        : json(502, { message: "scoreboard unavailable" });
    }
    if (action === "start") return json(200, { id: data });
    if (action === "results") return json(200, { rows: data ?? [] });
    return json(200, { ok: true });
  } catch (_e) {
    return json(502, { message: "scoreboard unavailable" });
  }
});
