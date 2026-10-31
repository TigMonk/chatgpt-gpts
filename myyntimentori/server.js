// Paikallinen käyttö: `node server.js` ja avaa http://localhost:3000
import { createServer } from "node:http";
import handler from "./api/lookup.js";
import { page } from "./build.js";

const port = process.env.PORT || 3000;
createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/lookup") {
    const shim = {
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) { res.statusCode = code; return this; },
      json(obj) { res.setHeader("content-type", "application/json; charset=utf-8"); res.end(JSON.stringify(obj)); }
    };
    return handler({ query: Object.fromEntries(url.searchParams) }, shim);
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.end(page());
  }
  res.statusCode = 404; res.end("Ei löytynyt");
}).listen(port, () => console.log(`Myyntimentori: http://localhost:${port}`));
