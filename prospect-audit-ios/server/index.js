// Optional backend: proxies Google Places API (New). Keeps your API key off the phone.
// Run: GOOGLE_API_KEY=xxx node server/index.js   (Node 18+, no deps). Deploy to Render/Fly/Railway.
const http = require('http');
const KEY = process.env.GOOGLE_API_KEY;
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const u = new URL(req.url, 'http://x');
  if (u.pathname !== '/lookup') { res.statusCode = 404; return res.end('{}'); }
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.regularOpeningHours,places.nationalPhoneNumber,places.websiteUri' },
      body: JSON.stringify({ textQuery: u.searchParams.get('q') }),
    });
    const p = ((await r.json()).places || [])[0];
    if (!p) return res.end('{}');
    res.end(JSON.stringify({
      name: p.displayName?.text, city: p.formattedAddress, rating: p.rating, reviews: p.userRatingCount,
      hours: !!p.regularOpeningHours, phone: p.nationalPhoneNumber, website: p.websiteUri,
      summary: `Google: ${p.rating ?? '?'}★ (${p.userRatingCount ?? 0} reviews) · ${p.nationalPhoneNumber ?? 'no phone'} · ${p.websiteUri ?? 'no website'}`,
    }));
  } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: String(e) })); }
}).listen(process.env.PORT || 3000);
