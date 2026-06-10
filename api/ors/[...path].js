// Functie serverless Vercel: proxy pentru OpenRouteService.
// Tine cheia (ORS_API_KEY) pe server, ca sa NU ajunga in bundle-ul de client.
// Clientul cheama /api/ors/<cale ORS> cu aceeasi metoda/body ca pentru ORS.

const ORS_BASE = "https://api.openrouteservice.org";

// Doar endpoint-urile folosite de aplicatie sunt permise (evitam un proxy deschis).
const ALLOWED_PREFIXES = ["v2/directions/", "v2/snap/", "geocode/"];

export default async function handler(req, res) {
  const key = process.env.ORS_API_KEY;
  if (!key) {
    res.status(500).json({ error: "ORS_API_KEY nu este configurata pe server" });
    return;
  }

  // Calea vine ca array din catch-all: /api/ors/v2/directions/driving-car/geojson
  const segments = req.query.path || [];
  const path = Array.isArray(segments) ? segments.join("/") : String(segments);

  if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
    res.status(400).json({ error: "Endpoint ORS nepermis" });
    return;
  }

  // Reconstruim eventualele query params originale (path este parametrul nostru intern)
  const url = new URL(`${ORS_BASE}/${path}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (k === "path") continue;
    if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, val));
    else url.searchParams.set(k, v);
  }

  const isBodyless = req.method === "GET" || req.method === "HEAD";

  try {
    const orsRes = await fetch(url.toString(), {
      method: req.method,
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
      },
      body: isBodyless ? undefined : JSON.stringify(req.body ?? {}),
    });

    const text = await orsRes.text();
    res.status(orsRes.status);
    res.setHeader(
      "Content-Type",
      orsRes.headers.get("content-type") || "application/json"
    );
    res.send(text);
  } catch {
    res.status(502).json({ error: "Cererea catre ORS a esuat (proxy)" });
  }
}
