// Myyntimentorin hakulogiikka: tunnistaa syötteen, hakee PRH:n yritystiedot,
// lukee verkkosivun (some-linkit, yhteystiedot, tekniikka) ja Google Newsin otsikot.
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

const UA = "Mozilla/5.0 (compatible; Myyntimentori/1.0; +https://github.com/tigmonk/chatgpt-gpts)";
const PRH = "https://avoindata.prh.fi/opendata-ytj-api/v3/companies";
const MAX_BYTES = 1_500_000;

export const SOCIAL = {
  instagram: /^(?:www\.)?instagram\.com$/,
  facebook: /^(?:www\.|m\.|fi-fi\.)?facebook\.com$|^fb\.com$/,
  linkedin: /^(?:[a-z]{2}\.|www\.)?linkedin\.com$/,
  tiktok: /^(?:www\.)?tiktok\.com$/,
  youtube: /^(?:www\.|m\.)?youtube\.com$|^youtu\.be$/,
  x: /^(?:www\.)?(?:twitter|x)\.com$/,
  pinterest: /^(?:[a-z]{2}\.|www\.)?pinterest\.[a-z.]+$/,
  threads: /^(?:www\.)?threads\.(?:net|com)$/
};
// Polut, jotka eivät ole profiileja (jakonapit, kirjautuminen jne.)
const NOT_PROFILE = /\/(sharer|share|intent|dialog|plugins|tr|login|signup|hashtag|explore|p\/|reel\/|watch\?|embed|policies|legal|help)/i;

/* ---------- syötteen tunnistus ---------- */
export function classify(raw) {
  const q = String(raw || "").trim();
  if (/^\d{7}-\d$/.test(q)) return { kind: "ytunnus", value: q };
  if (/^\d{8}$/.test(q)) return { kind: "ytunnus", value: q.slice(0, 7) + "-" + q[7] };
  const at = q.match(/^@([\w.]{2,30})$/);
  if (at) return { kind: "handle", value: at[1], network: "instagram" };
  let u = null;
  if (/^https?:\/\//i.test(q)) u = safeUrl(q);
  else if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(q) && !/\s/.test(q)) u = safeUrl("https://" + q);
  if (u) {
    const host = u.hostname.toLowerCase();
    for (const [net, re] of Object.entries(SOCIAL)) {
      if (re.test(host)) {
        const handle = u.pathname.split("/").filter(Boolean).filter(s => !/^(company|in|pages|profile\.php|@)$/.test(s))[0] || "";
        return { kind: "handle", value: handle.replace(/^@/, ""), network: net, url: u.href };
      }
    }
    return { kind: "url", value: u.origin + u.pathname, url: u.href };
  }
  return { kind: "name", value: q };
}

function safeUrl(s) { try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u : null; } catch { return null; } }

/* ---------- turvallinen haku (ei sisäverkkoon) ---------- */
function privateIp(ip) {
  if (isIP(ip) === 6) { const l = ip.toLowerCase(); return l === "::1" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:") && privateIp(l.slice(7)); }
  const p = ip.split(".").map(Number);
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}
async function assertPublic(u) {
  if (!/^https?:$/.test(u.protocol) || (u.port && !["80", "443"].includes(u.port))) throw new Error("Vain tavalliset http/https-osoitteet sallitaan");
  const h = u.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(h) ? [{ address: h }] : await dnsLookup(h, { all: true });
  if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error("Osoite ei ole julkinen");
}
export async function safeFetch(url, { fetchImpl = fetch, timeout = 8000, maxRedirects = 4, check = assertPublic } = {}) {
  let u = new URL(url);
  const t0 = Date.now();
  for (let i = 0; i <= maxRedirects; i++) {
    await check(u);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    let res;
    try { res = await fetchImpl(u.href, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": UA, "accept-language": "fi,en;q=0.8" } }); }
    finally { clearTimeout(timer); }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { u = new URL(res.headers.get("location"), u); continue; }
    const text = await readCapped(res);
    return { status: res.status, ok: res.ok, url: u.href, text, ms: Date.now() - t0, headers: res.headers };
  }
  throw new Error("Liian monta uudelleenohjausta");
}
async function readCapped(res) {
  if (!res.body || !res.body.getReader) return (await res.text()).slice(0, MAX_BYTES);
  const reader = res.body.getReader(); const chunks = []; let n = 0;
  while (n < MAX_BYTES) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); n += value.length; }
  try { reader.cancel(); } catch {}
  return new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))).subarray(0, MAX_BYTES));
}

/* ---------- PRH / YTJ ---------- */
const fiDesc = arr => (arr || []).find(d => String(d.languageCode) === "1")?.description || (arr || [])[0]?.description || "";
export function parsePrhCompany(c) {
  if (!c) return null;
  const names = (c.names || []).filter(n => !n.endDate);
  const main = names.find(n => String(n.type) === "1") || names[0] || (c.names || [])[0] || {};
  const aux = names.filter(n => n !== main).map(n => n.name);
  const addr = (c.addresses || []).find(a => String(a.type) === "1") || (c.addresses || [])[0];
  const city = addr && ((addr.postOffices || []).find(p => String(p.languageCode) === "1") || (addr.postOffices || [])[0] || {}).city;
  const street = addr && [addr.street, addr.buildingNumber, addr.entrance, addr.apartmentNumber].filter(Boolean).join(" ");
  const web = c.website?.url || c.website || "";
  return {
    businessId: c.businessId?.value || c.businessId || "",
    name: main.name || "",
    auxNames: aux,
    form: fiDesc((c.companyForms || []).find(f => !f.endDate)?.descriptions),
    industry: fiDesc(c.mainBusinessLine?.descriptions),
    industryCode: c.mainBusinessLine?.type || "",
    registrationDate: c.businessId?.registrationDate || c.registrationDate || "",
    address: [street, addr?.postCode, city].filter(Boolean).join(", "),
    city: city || "",
    website: typeof web === "string" ? web : "",
    active: !c.endDate && String(c.status ?? "2") !== "3"
  };
}
export async function prhSearch({ businessId, name }, fetchImpl = fetch) {
  const qs = businessId ? "businessId=" + encodeURIComponent(businessId) : "name=" + encodeURIComponent(name);
  const r = await fetchImpl(`${PRH}?${qs}`, { headers: { accept: "application/json", "user-agent": UA } });
  if (!r.ok) throw new Error("PRH vastasi " + r.status);
  const j = await r.json();
  return (j.companies || []).map(parsePrhCompany).filter(Boolean);
}
// Valitsee parhaan osuman nimen samankaltaisuudella (aktiiviset ensin)
export function bestMatch(list, name) {
  const norm = s => String(s).toLowerCase().replace(/\b(oy|ab|oyj|ky|tmi|ry|ltd)\b/g, "").replace(/[^a-z0-9åäö]/g, "");
  const n = norm(name);
  const score = c => (c.active ? 2 : 0) + (norm(c.name) === n ? 5 : norm(c.name).startsWith(n) || n.startsWith(norm(c.name)) ? 3 : norm(c.name).includes(n) ? 1 : 0);
  return [...list].sort((a, b) => score(b) - score(a))[0] || null;
}

/* ---------- verkkosivun analyysi ---------- */
const attr = (tag, a) => (tag.match(new RegExp(`\\b${a}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")) || []).slice(1).find(v => v !== undefined) || "";
const meta = (html, key) => { for (const m of html.matchAll(/<meta\b[^>]*>/gi)) { const t = m[0]; if ([attr(t, "name"), attr(t, "property")].some(v => v.toLowerCase() === key)) return decode(attr(t, "content")); } return ""; };
const decode = s => String(s).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/\s+/g, " ").trim();

const TECH = [
  ["WordPress", /wp-content|wp-includes|generator"?\s*content="WordPress/i], ["Wix", /wix\.com|wixstatic|_wixCssImports/i],
  ["Shopify", /cdn\.shopify|Shopify\.theme/i], ["Squarespace", /squarespace/i], ["Webflow", /webflow/i],
  ["Joomla", /\/media\/jui\/|Joomla!/i], ["Drupal", /Drupal\.settings|\/sites\/default\/files/i], ["WooCommerce", /woocommerce/i],
  ["Elementor", /elementor/i], ["Next.js", /__NEXT_DATA__|\/_next\//], ["Google Analytics", /gtag\(|google-analytics\.com|googletagmanager\.com\/gtag/i],
  ["Google Tag Manager", /googletagmanager\.com\/gtm/i], ["Meta Pixel", /connect\.facebook\.net\/[^"']*fbevents|fbq\(/i],
  ["Cookiebot", /cookiebot/i], ["CookieYes / muu evästebanneri", /cookieyes|cookie-law-info|onetrust|cookieconsent/i],
  ["Chat-ikkuna", /tawk\.to|intercom|zendesk|giosg|crisp\.chat|livechat/i], ["Ajanvaraus", /timma|vello|slotti|varaa\.fi|calendly|booksy|fresha|bokadirekt/i],
  ["Verkkokauppa", /add-to-cart|ostoskori|lisää ostoskoriin|cart\b/i]
];

export function analyzeHtml(html, pageUrl, { ms = 0, https = /^https:/.test(pageUrl) } = {}) {
  const base = safeUrl(pageUrl);
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const description = meta(html, "description") || meta(html, "og:description");
  const siteName = meta(html, "og:site_name");
  const lang = (html.match(/<html\b[^>]*\blang\s*=\s*["']?([\w-]+)/i) || [])[1] || "";
  const generator = meta(html, "generator");
  const socials = {}; const emails = new Set(); const phones = new Set();
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = decode(attr(m[0], "href")); if (!href) continue;
    if (/^mailto:/i.test(href)) { const e = href.slice(7).split("?")[0].trim(); if (/@/.test(e)) emails.add(e.toLowerCase()); continue; }
    if (/^tel:/i.test(href)) { phones.add(href.slice(4).replace(/[^\d+]/g, "")); continue; }
    const u = safeUrl(new URL(href, base || "https://x.invalid").href); if (!u) continue;
    const host = u.hostname.toLowerCase();
    for (const [net, re] of Object.entries(SOCIAL)) if (re.test(host) && !socials[net] && !NOT_PROFILE.test(u.pathname + u.search) && u.pathname.length > 1) socials[net] = u.origin + u.pathname.replace(/\/$/, "");
  }
  const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  for (const e of text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []) if (!/\.(png|jpg|svg|webp)$/i.test(e)) emails.add(e.toLowerCase());
  const businessIds = [...new Set((text.match(/\b\d{7}-\d\b/g) || []))];
  const tech = TECH.filter(([, re]) => re.test(html)).map(([n]) => n);
  if (generator && !tech.some(t => generator.toLowerCase().includes(t.toLowerCase()))) tech.unshift(generator);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgNoAlt = imgs.filter(t => !attr(t, "alt")).length;
  const h1 = (html.match(/<h1\b/gi) || []).length;
  const viewport = /<meta[^>]+name=["']?viewport/i.test(html);
  const ogImage = meta(html, "og:image");
  const year = Math.max(0, ...[...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map(m => +m[1]));
  const sizeKB = Math.round(Buffer.byteLength(html) / 1024);
  const words = text.split(/\s+/).filter(Boolean).length;

  const obs = []; const hooks = [];
  const add = (level, t, hook) => { obs.push({ level, text: t }); if (hook) hooks.push(hook); };
  add(https ? "good" : "bad", https ? "Suojattu yhteys (https)" : "Ei suojattua yhteyttä (https puuttuu)", https ? null : "Selain varoittaa sivustosta kävijöitä – tämä karkottaa asiakkaita.");
  add(viewport ? "good" : "bad", viewport ? "Mobiilisovitus löytyy" : "Ei mobiilisovitusta", viewport ? null : "Yli puolet kävijöistä tulee puhelimella, ja sivu ei ole tehty puhelimelle.");
  if (ms) add(ms < 1500 ? "good" : ms < 3500 ? "warn" : "bad", `Etusivu latautui palvelimelta ${(ms / 1000).toFixed(1)} s:ssa`, ms >= 3500 ? "Sivu on hidas – hitaus maksaa kävijöitä ja hakukonenäkyvyyttä." : null);
  add(title ? (title.length > 70 ? "warn" : "good") : "bad", title ? `Sivun otsikko: "${title.slice(0, 80)}"` : "Sivulta puuttuu otsikko", title ? null : "Hakukoneet eivät tiedä mistä sivu kertoo.");
  add(description ? "good" : "warn", description ? "Hakutuloksen kuvausteksti on kirjoitettu" : "Hakutuloksen kuvausteksti puuttuu", description ? null : "Google näyttää hakutuloksessa satunnaista tekstiä, koska kuvaus puuttuu.");
  add(h1 === 1 ? "good" : "warn", h1 === 1 ? "Yksi pääotsikko (H1)" : `Pääotsikoita (H1): ${h1}`, null);
  if (imgs.length) add(imgNoAlt ? "warn" : "good", imgNoAlt ? `${imgNoAlt}/${imgs.length} kuvalta puuttuu alt-teksti` : "Kaikilla kuvilla on alt-teksti", null);
  add(ogImage ? "good" : "warn", ogImage ? "Jakokuva someen määritelty" : "Ei jakokuvaa: linkki näyttää somessa tylsältä", null);
  const nSoc = Object.keys(socials).length;
  add(nSoc ? "good" : "warn", nSoc ? `Somelinkit sivulla: ${Object.keys(socials).join(", ")}` : "Sivulla ei ole linkkejä someen", nSoc ? null : "Somekanavat eivät näy sivuilla – kävijä ei löydä niitä.");
  if (year && year < new Date().getFullYear() - 1) add("warn", `Copyright-vuosi ${year} – sivua ei ehkä ole päivitetty`, `Sivuston päivitys näyttää jääneen vuoteen ${year}.`);
  if (!tech.some(t => /Analytics|Tag Manager/.test(t))) add("warn", "Kävijäseurantaa ei löytynyt", "Ilman kävijäseurantaa ei tiedetä mistä asiakkaat tulevat.");
  if (tech.includes("Meta Pixel") && !tech.some(t => /Cookiebot|evästebanneri/.test(t))) add("warn", "Meta Pixel ilman tunnistettavaa evästebanneria", "Seurantaevästeet ilman suostumusta voivat olla tietosuojariski.");
  if (!emails.size && !phones.size) add("warn", "Etusivulla ei näy sähköpostia eikä puhelinnumeroa", "Yhteydenotto on tehty vaikeaksi etusivulla.");
  add("info", `Koko ${sizeKB} kt, noin ${words} sanaa${lang ? ", kieli " + lang : ""}`, null);

  return { url: pageUrl, title, description, siteName, lang, tech, socials, emails: [...emails].slice(0, 5), phones: [...phones].slice(0, 5), businessIds, https, viewport, h1, imgCount: imgs.length, imgNoAlt, ogImage, copyrightYear: year || null, sizeKB, ms, observations: obs, hooks };
}

/* ---------- Google News ---------- */
export function parseRss(xml, limit = 6) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit).map(m => {
    const g = t => decode((m[1].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`)) || [])[1] || "").replace(/^<!\[CDATA\[|\]\]>$/g, "");
    const d = new Date(g("pubDate"));
    return { title: g("title"), link: g("link"), source: g("source"), date: isNaN(d) ? "" : d.toISOString().slice(0, 10) };
  });
}

/* ---------- koko haku ---------- */
export async function runLookup(q, deps = {}) {
  const f = deps.fetchImpl || fetch;
  const sf = (url) => safeFetch(url, { fetchImpl: f, check: deps.check });
  const cls = classify(q);
  const out = { query: q, kind: cls.kind, company: null, candidates: [], web: null, news: [], socials: {}, guesses: [], errors: [] };
  const err = (where, e) => out.errors.push(`${where}: ${e.message || e}`);
  let site = null; let nameForSearch = null;

  const prh = async (p) => { try { return await prhSearch(p, f); } catch (e) { err("Kaupparekisteri", e); return []; } };
  const setCompany = (list, name) => { if (!list.length) return; out.candidates = list.slice(0, 6).map(c => ({ businessId: c.businessId, name: c.name, city: c.city, active: c.active })); out.company = name ? bestMatch(list, name) : list[0]; };
  const loadSite = async (url) => {
    try { const r = await sf(url); if (r.status >= 400) throw new Error("sivu vastasi " + r.status); out.web = analyzeHtml(r.text, r.url, { ms: r.ms }); return true; }
    catch (e) { err("Verkkosivu", e); return false; }
  };

  if (cls.kind === "ytunnus") setCompany(await prh({ businessId: cls.value }));
  if (cls.kind === "name") { nameForSearch = cls.value; setCompany(await prh({ name: cls.value }), cls.value); }
  if (cls.kind === "url") site = cls.url;
  if (cls.kind === "handle") {
    out.socials[cls.network] = cls.url || `https://www.instagram.com/${cls.value}`;
    const h = cls.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    // Arvataan verkkosivu käyttäjänimestä – merkitään arvaukseksi
    for (const dom of [`${h}.fi`, `www.${h}.fi`, `${h}.com`]) {
      if (await loadSite(`https://${dom}`)) { out.guesses.push({ field: "web", value: out.web.url, note: `Arvattu käyttäjänimestä @${cls.value} – tarkista että sivu on oikea` }); break; }
    }
    out.errors = out.errors.filter(e => !e.startsWith("Verkkosivu"));
    if (!out.web) nameForSearch = cls.value.replace(/[._]/g, " ");
  }
  if (site && !out.web) await loadSite(site);
  if (out.web) {
    Object.assign(out.socials, out.web.socials);
    if (!out.company && out.web.businessIds.length) setCompany(await prh({ businessId: out.web.businessIds[0] }));
    if (!out.company) { nameForSearch = out.web.siteName || out.web.title.split(/\s[|\-–—:]\s/)[0] || new URL(out.web.url).hostname.replace(/^www\./, "").split(".")[0]; }
  }
  if (!out.company && nameForSearch && cls.kind !== "name") {
    const list = await prh({ name: nameForSearch });
    if (list.length) { setCompany(list, nameForSearch); out.guesses.push({ field: "company", value: out.company.name, note: `Haettu nimellä "${nameForSearch}" – varmista että yritys on oikea` }); }
  }
  if (out.company && out.company.website && !out.web) {
    const w = /^https?:/i.test(out.company.website) ? out.company.website : "https://" + out.company.website;
    if (await loadSite(w)) Object.assign(out.socials, out.web.socials);
  }
  const newsName = out.company?.name?.replace(/\s(Oy|Ab|Oyj|Ky|Tmi)$/i, "") || nameForSearch || cls.value;
  if (newsName) {
    try {
      const r = await f(`https://news.google.com/rss/search?q=${encodeURIComponent('"' + newsName + '"')}&hl=fi&gl=FI&ceid=FI:fi`, { headers: { "user-agent": UA } });
      if (r.ok) out.news = parseRss(await r.text());
    } catch (e) { err("Uutiset", e); }
  }
  return out;
}
