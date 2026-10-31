import test from "node:test";
import assert from "node:assert/strict";
import { classify, analyzeHtml, parsePrhCompany, parseRss, runLookup, bestMatch } from "../api/_lib.js";

test("classify tunnistaa syötteet", () => {
  assert.equal(classify("1234567-8").kind, "ytunnus");
  assert.equal(classify("12345678").value, "1234567-8");
  assert.deepEqual(classify("@parturiliisa"), { kind: "handle", value: "parturiliisa", network: "instagram" });
  assert.equal(classify("https://www.instagram.com/parturiliisa/").value, "parturiliisa");
  assert.equal(classify("facebook.com/ParturiLiisa").network, "facebook");
  assert.equal(classify("linkedin.com/company/laine-co").value, "laine-co");
  assert.equal(classify("parturiliisa.fi").kind, "url");
  assert.equal(classify("Parturi Liisa").kind, "name");
  assert.equal(classify("Markku Laine").kind, "name");
});

const HTML = `<html lang="fi"><head><title>Parturi Liisa | Kampaamo Tampere</title>
<meta name="description" content="Parturi-kampaamo &amp; värjäykset"><meta name="viewport" content="width=device-width">
<meta property="og:site_name" content="Parturi Liisa"><link href="/wp-content/x.css"></head><body>
<h1>Tervetuloa</h1><img src="a.jpg"><img src="b.jpg" alt="Liisa">
<a href="https://www.instagram.com/parturiliisa/">IG</a><a href="https://www.facebook.com/sharer/sharer.php?u=x">jaa</a>
<a href="https://facebook.com/ParturiLiisa">FB</a><a href="mailto:liisa@parturiliisa.fi">Posti</a><a href="tel:040 123 4567">Soita</a>
<p>Y-tunnus 1234567-8 © 2021 Parturi Liisa</p><script>fbq('init')</script></body></html>`;

test("analyzeHtml poimii somet, yhteystiedot ja havainnot", () => {
  const a = analyzeHtml(HTML, "https://parturiliisa.fi/", { ms: 900 });
  assert.equal(a.socials.instagram, "https://www.instagram.com/parturiliisa");
  assert.equal(a.socials.facebook, "https://facebook.com/ParturiLiisa");
  assert.deepEqual(a.emails, ["liisa@parturiliisa.fi"]);
  assert.deepEqual(a.phones, ["0401234567"]);
  assert.deepEqual(a.businessIds, ["1234567-8"]);
  assert.ok(a.tech.includes("WordPress") && a.tech.includes("Meta Pixel"));
  assert.equal(a.imgNoAlt, 1);
  assert.equal(a.copyrightYear, 2021);
  assert.ok(a.hooks.some(h => h.includes("2021")));
  assert.ok(a.hooks.some(h => h.includes("kävijäseurantaa")));
});

const PRH = { totalResults: 1, companies: [{
  businessId: { value: "1234567-8", registrationDate: "2015-03-02" },
  names: [{ name: "Parturi Liisa Oy", type: "1", registrationDate: "2015-03-02" }, { name: "Vanha nimi", type: "1", endDate: "2014-01-01" }],
  mainBusinessLine: { type: "96021", descriptions: [{ languageCode: "3", description: "Hairdressing" }, { languageCode: "1", description: "Parturit ja kampaamot" }] },
  companyForms: [{ type: "16", descriptions: [{ languageCode: "1", description: "Osakeyhtiö" }] }],
  website: { url: "parturiliisa.fi" },
  addresses: [{ type: 1, street: "Hämeenkatu", buildingNumber: "5", postCode: "33100", postOffices: [{ city: "TAMPERE", languageCode: "1" }] }]
}]};

test("parsePrhCompany", () => {
  const c = parsePrhCompany(PRH.companies[0]);
  assert.equal(c.name, "Parturi Liisa Oy");
  assert.equal(c.industry, "Parturit ja kampaamot");
  assert.equal(c.form, "Osakeyhtiö");
  assert.equal(c.address, "Hämeenkatu 5, 33100, TAMPERE");
  assert.equal(c.website, "parturiliisa.fi");
  assert.equal(bestMatch([{ name: "Liisan Kukka Oy", active: true }, c], "Parturi Liisa").name, "Parturi Liisa Oy");
});

test("parseRss", () => {
  const n = parseRss(`<rss><item><title>Liisa avasi toisen liikkeen - Aamulehti</title><link>https://n/1</link><pubDate>Tue, 07 Oct 2026 08:00:00 GMT</pubDate><source url="x">Aamulehti</source></item></rss>`);
  assert.deepEqual(n[0], { title: "Liisa avasi toisen liikkeen - Aamulehti", link: "https://n/1", source: "Aamulehti", date: "2026-10-07" });
});

function mockFetch(routes) {
  return async (url) => {
    const hit = Object.entries(routes).find(([k]) => url.startsWith(k));
    if (!hit) throw new Error("ei vastausta: " + url);
    const [status, body] = hit[1];
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
}
const RSS = `<rss><item><title>Uutinen</title><link>https://n/1</link><pubDate>Tue, 07 Oct 2026 08:00:00 GMT</pubDate></item></rss>`;
const deps = (r) => ({ fetchImpl: mockFetch(r), check: async () => {} });

test("haku nimellä: PRH → sivu → somet → uutiset", async () => {
  const r = await runLookup("Parturi Liisa", deps({
    "https://avoindata.prh.fi": [200, PRH], "https://parturiliisa.fi": [200, HTML], "https://news.google.com": [200, RSS] }));
  assert.equal(r.company.businessId, "1234567-8");
  assert.equal(r.web.title, "Parturi Liisa | Kampaamo Tampere");
  assert.equal(r.socials.instagram, "https://www.instagram.com/parturiliisa");
  assert.equal(r.news.length, 1);
  assert.deepEqual(r.errors, []);
});

test("haku Instagram-tunnuksella arvaa sivun ja löytää Y-tunnuksen sivulta", async () => {
  const r = await runLookup("@parturiliisa", deps({
    "https://parturiliisa.fi": [200, HTML], "https://avoindata.prh.fi": [200, PRH], "https://news.google.com": [200, RSS] }));
  assert.equal(r.web.url, "https://parturiliisa.fi/");
  assert.equal(r.company.name, "Parturi Liisa Oy");
  assert.equal(r.guesses[0].field, "web");
});

test("haku sivun osoitteella", async () => {
  const r = await runLookup("parturiliisa.fi", deps({
    "https://parturiliisa.fi": [200, HTML], "https://avoindata.prh.fi": [200, PRH], "https://news.google.com": [200, RSS] }));
  assert.equal(r.company.businessId, "1234567-8");
  assert.equal(r.socials.facebook, "https://facebook.com/ParturiLiisa");
});

test("PRH-virhe ei kaada hakua", async () => {
  const r = await runLookup("1234567-8", deps({ "https://avoindata.prh.fi": [503, "x"], "https://news.google.com": [200, RSS] }));
  assert.equal(r.company, null);
  assert.ok(r.errors[0].includes("503"));
});

test("sisäverkon osoitteet estetään", async () => {
  const r = await runLookup("http://127.0.0.1/admin", { fetchImpl: mockFetch({}) });
  assert.ok(r.errors.some(e => e.includes("julkinen")));
});
