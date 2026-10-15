import { createHmac, timingSafeEqual, randomUUID, createHash } from 'node:crypto';

const RECIPIENT = 'rossignoltalyana12@gmail.com';
const SENDER = 'Talyana Rossignol <portfolio@contact.lorn-digital-studio.fr>';
const ORIGINS = new Set([
  'https://talyana-rossignol-portfolio.vercel.app',
  'https://talyana-rossignol-portfolio-loics-projects-8004da1d.vercel.app',
  'https://talyana-rossignol-editorial.lorn-digital-studio.chatgpt.site'
]);
const MAX_BODY = 24000;
// A bounded, per-instance throttle supplements the honeypot and signed form token.
// It is not a distributed quota; the provider account retains its sending limits.
const requests = new Map();
const WINDOW = 15 * 60 * 1000;
const hash = value => createHash('sha256').update(value).digest('hex');
const sign = value => createHmac('sha256', process.env.RESEND_API_KEY).update(value).digest('hex');
const clientId = request => hash((request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim());
const ready = () => process.env.CONTACT_FORM_ENABLED === 'true' && Boolean(process.env.RESEND_API_KEY);

function reply(request, status, value, extra = {}) {
  const origin = request.headers.get('origin');
  const headers = { 'Cache-Control': 'no-store', 'Vary': 'Origin', ...extra };
  if (ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return Response.json(value, { status, headers });
}

export async function handleContact(request, send = fetch) {
  const origin = request.headers.get('origin');
  if (origin && !ORIGINS.has(origin)) return reply(request, 403, { error: 'Origine non autorisée.' });
  if (request.method === 'OPTIONS') {
    return reply(request, 200, {}, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  }
  if (!['GET', 'POST'].includes(request.method)) return reply(request, 405, { error: 'Méthode non autorisée.' }, { Allow: 'GET, POST, OPTIONS' });
  if (!ready()) return reply(request, 503, { code: 'unavailable', error: 'Envoi direct indisponible. Vous pouvez envoyer votre demande par messagerie.' });
  const ip = clientId(request);
  if (request.method === 'GET') {
    const value = `${Date.now()}.${randomUUID()}.${ip}`;
    return reply(request, 200, { available: true, token: `${value}.${sign(value)}` });
  }
  if (!ORIGINS.has(origin)) return reply(request, 403, { error: 'Origine non autorisée.' });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return reply(request, 415, { error: 'Format non pris en charge.' });
  if (Number(request.headers.get('content-length')) > MAX_BODY) return reply(request, 413, { error: 'Message trop long.' });
  let data;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > MAX_BODY) return reply(request, 413, { error: 'Message trop long.' });
    data = JSON.parse(raw);
  } catch { return reply(request, 400, { error: 'Demande invalide.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(request, 400, { error: 'Demande invalide.' });
  if (data.website) return reply(request, 400, { error: 'Demande refusée.' });
  const fields = {};
  for (const [key, limit] of Object.entries({ name: 150, company: 200, email: 254, message: 4000 })) {
    if (typeof data[key] !== 'string' || data[key].length > limit) return reply(request, 400, { error: 'Vérifiez les champs du formulaire.' });
    fields[key] = data[key].trim();
  }
  const { name, company, email, message } = fields;
  if (!name || !message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\r\n\x00]/.test(name + company + email)) {
    return reply(request, 400, { error: 'Renseignez un nom, une adresse e-mail valide et votre message.' });
  }
  const token = typeof data.token === 'string' ? data.token : '';
  const parts = token.split('.');
  const [time, nonce, address, signature] = parts;
  if (parts.length !== 4 || !/^\d{13}$/.test(time || '') || !/^[\da-f-]{36}$/.test(nonce || '') || !/^[\da-f]{64}$/.test(signature || '') || address !== ip) {
    return reply(request, 400, { code: 'expired', error: 'Veuillez actualiser le formulaire puis réessayer.' });
  }
  const expected = sign(`${time}.${nonce}.${address}`);
  const age = Date.now() - Number(time);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) || age < 0 || age > 60 * 60 * 1000) {
    return reply(request, 400, { code: 'expired', error: 'Veuillez actualiser le formulaire puis réessayer.' });
  }
  if (age < 2000) return reply(request, 429, { error: 'Veuillez patienter quelques secondes avant de réessayer.' }, { 'Retry-After': '2' });
  const now = Date.now();
  for (const [key, value] of requests) if (value.until < now) requests.delete(key);
  const rate = requests.get(ip) || { count: 0, until: now + WINDOW };
  if (rate.count >= 5 || (requests.size >= 10000 && !requests.has(ip))) return reply(request, 429, { error: 'Trop de demandes. Réessayez plus tard ou utilisez votre messagerie.' });
  rate.count++; requests.set(ip, rate);
  try {
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': hash(token + JSON.stringify(fields)) },
      body: JSON.stringify({ from: SENDER, to: [RECIPIENT], reply_to: email, subject: `Demande de ${name}${company ? ` — ${company}` : ''}`, text: `Nouvelle demande pour Talyana Rossignol\n\nClient : ${name}\nSociété / Projet : ${company || 'Non précisé'}\nE-mail : ${email}\n\n${message}\n\nPour répondre au client, utilisez le bouton Répondre de votre messagerie.` }),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) {
      console.error('contact_delivery_failed', { status: response.status });
      return reply(request, 502, { error: 'L’envoi n’a pas pu être confirmé. Votre texte est conservé ; réessayez ou utilisez votre messagerie.' });
    }
    return reply(request, 200, { ok: true, message: 'Votre demande a bien été envoyée à Talyana. Merci !' });
  } catch {
    console.error('contact_delivery_unconfirmed');
    return reply(request, 502, { error: 'L’envoi n’a pas pu être confirmé. Réessayez avec le même message ou utilisez votre messagerie.' });
  }
}

export default { fetch: request => handleContact(request) };
