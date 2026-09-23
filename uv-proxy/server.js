#!/usr/bin/env node
// Local self-hosted Ultraviolet web proxy (personal use).
// Serves the UV client + a Bare server, with an ad/tracker blocklist in the SW.
//
//   node server.js            -> http://127.0.0.1:8080
//   node server.js 9000       -> custom port
//
// Localhost only. Not a public/open proxy.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { createBareServer } = require("@tomphttp/bare-server-node");

const PORT = Number(process.argv[2]) || 8080;
const DIST = path.join(__dirname, "node_modules/@titaniumnetwork-dev/ultraviolet/dist");
const PUB = path.join(__dirname, "public");
const bare = createBareServer("/bare/", { logErrors: false });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}
function file(res, p) {
  fs.readFile(p, (err, data) => {
    if (err) return send(res, 404, "not found");
    res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (bare.shouldRoute(req)) return bare.routeRequest(req, res);
  const u = new URL(req.url, "http://localhost");
  const p = u.pathname;
  if (p === "/") return file(res, path.join(PUB, "index.html"));
  if (p === "/sw.js") return file(res, path.join(PUB, "sw.js"));
  if (p === "/uv.config.js") return file(res, path.join(PUB, "uv.config.js"));
  if (["/uv.bundle.js", "/uv.client.js", "/uv.handler.js", "/uv.sw.js"].indexOf(p) >= 0) return file(res, path.join(DIST, p.slice(1)));
  return send(res, 404, "not found");
});
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head);
  else socket.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Ultraviolet proxy running at http://127.0.0.1:" + PORT);
  console.log("Open that URL to browse. Localhost only; not an open proxy.");
});