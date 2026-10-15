import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../api/contact.js';

const origin = 'https://talyana-rossignol-portfolio.vercel.app';
const url = `${origin}/api/contact`;
process.env.RESEND_API_KEY = 'test-only-not-a-real-secret';
process.env.CONTACT_FORM_ENABLED = 'true';
const base = { name: 'Test technique', company: '', email: 'visitor@example.com', message: 'Demande de collaboration de test.', website: '' };
const headers = ip => ({ origin, 'content-type': 'application/json', 'x-forwarded-for': ip });
async function token(ip, age = 3000) {
  const now = Date.now;
  Date.now = () => now() - age;
  try { return (await (await handleContact(new Request(url, { headers: headers(ip) }))).json()).token; }
  finally { Date.now = now; }
}
const post = (ip, data, send) => handleContact(new Request(url, { method: 'POST', headers: headers(ip), body: JSON.stringify(data) }), send);
const noSend = () => { throw new Error('Provider must not be called'); };

test('unverified configuration cannot report successful delivery', async () => {
  process.env.CONTACT_FORM_ENABLED = 'false';
  const r = await handleContact(new Request(url), noSend);
  assert.equal(r.status, 503); assert.equal((await r.json()).code, 'unavailable');
  process.env.CONTACT_FORM_ENABLED = 'true';
});
test('successful request uses a fixed recipient and visitor reply-to', async () => {
  const ip = '192.0.2.1'; const t = await token(ip); let call;
  const r = await post(ip, { ...base, company: 'Projet shooting', token: t, to: 'attacker@example.com' }, async (target, options) => {
    call = { target, ...options }; return Response.json({ id: 'mock-email-id' });
  });
  assert.equal(r.status, 200); assert.equal((await r.json()).ok, true);
  const payload = JSON.parse(call.body);
  assert.deepEqual(payload.to, ['rossignoltalyana12@gmail.com']);
  assert.equal(payload.reply_to, base.email);
  assert.equal(payload.subject, 'Demande de Test technique — Projet shooting');
  assert.match(payload.text, /Client : Test technique/);
  assert.equal(call.target, 'https://api.resend.com/emails');
  assert.match(call.headers['Idempotency-Key'], /^[a-f0-9]{64}$/);
});
test('retrying the same request keeps provider idempotency key', async () => {
  const ip = '192.0.2.2'; const t = await token(ip); const keys = [];
  const send = async (_, o) => { keys.push(o.headers['Idempotency-Key']); return Response.json({ id: 'mock-id' }); };
  await post(ip, { ...base, token: t }, send); await post(ip, { ...base, token: t }, send);
  assert.equal(keys[0], keys[1]);
});
test('honeypot and invalid fields are rejected without sending', async () => {
  const ip = '192.0.2.3'; const t = await token(ip);
  for (const changes of [{ website: 'spam' }, { email: 'bad-email' }, { name: 'Name\r\nBcc: other@example.com' }, { message: 'x'.repeat(4001) }, { name: '' }]) {
    assert.equal((await post(ip, { ...base, token: t, ...changes }, noSend)).status, 400);
  }
});
test('foreign origins are rejected and Sites origin receives CORS', async () => {
  assert.equal((await handleContact(new Request(url, { headers: { origin: 'https://untrusted.example' } }), noSend)).status, 403);
  const site = 'https://talyana-rossignol-editorial.lorn-digital-studio.chatgpt.site';
  const r = await handleContact(new Request(url, { method: 'OPTIONS', headers: { origin: site } }));
  assert.equal(r.headers.get('access-control-allow-origin'), site);
});
test('signed token rejects forgery, other client, expiry and rapid submit', async () => {
  const ip = '192.0.2.4'; const t = await token(ip);
  assert.equal((await post(ip, { ...base, token: t.slice(0,-1) + (t.endsWith('a') ? 'b' : 'a') }, noSend)).status, 400);
  assert.equal((await post('192.0.2.5', { ...base, token: t }, noSend)).status, 400);
  assert.equal((await post(ip, { ...base, token: await token(ip, 3601000) }, noSend)).status, 400);
  assert.equal((await post(ip, { ...base, token: await token(ip, 0) }, noSend)).status, 429);
});
test('provider failure never appears as successful delivery', async () => {
  const ip = '192.0.2.6'; const t = await token(ip);
  const r = await post(ip, { ...base, token: t }, async () => Response.json({ message: 'Provider-specific details' }, { status: 403 }));
  assert.equal(r.status, 502); assert.equal((await r.json()).ok, undefined);
});
test('throttle rejects excess attempts', async () => {
  const ip = '192.0.2.7'; const t = await token(ip);
  for (let i = 0; i < 5; i++) assert.equal((await post(ip, { ...base, token: t }, async () => Response.json({ id: 'mock-id' }))).status, 200);
  assert.equal((await post(ip, { ...base, token: t }, noSend)).status, 429);
});
test('oversized and malformed bodies are rejected', async () => {
  for (const [body, expected] of [['{broken',400], ['a'.repeat(25000),413]]) {
    const r = await handleContact(new Request(url, { method: 'POST', headers: headers('192.0.2.8'), body }), noSend);
    assert.equal(r.status, expected);
  }
});
