// Tekee index.html:stä täyden HTML-dokumentin hakemistoon public/ (Vercel ja paikallinen palvelin)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
export function page() {
  const body = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  return `<!doctype html><html lang="fi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  mkdirSync(new URL("./public/", import.meta.url), { recursive: true });
  writeFileSync(new URL("./public/index.html", import.meta.url), page());
  console.log("public/index.html valmis");
}
