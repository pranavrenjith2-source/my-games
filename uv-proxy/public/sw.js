/*global UVServiceWorker, __uv$config*/
importScripts("uv.bundle.js");
importScripts("uv.config.js");
importScripts(__uv$config.sw || "uv.sw.js");

// Ad / tracker blocklist — checked against the real target of every proxied request.
const AD_DOMAINS = [
  "doubleclick.net", "googlesyndication.com", "googleadservices.com", "googletagservices.com", "google-analytics.com",
  "googletagmanager.com", "adservice.google.com", "2mdn.net", "adnxs.com", "adsrvr.org", "rubiconproject.com",
  "pubmatic.com", "openx.net", "casalemedia.com", "criteo.com", "criteo.net", "taboola.com", "outbrain.com",
  "scorecardresearch.com", "quantserve.com", "amazon-adsystem.com", "adsafeprotected.com", "moatads.com",
  "serving-sys.com", "mathtag.com", "turn.com", "bidswitch.net", "sharethrough.com", "teads.tv", "smartadserver.com",
  "yieldmo.com", "3lift.com", "adcolony.com", "applovin.com", "chartbeat.com", "hotjar.com", "mixpanel.com",
  "segment.io", "segment.com", "fullstory.com", "mouseflow.com", "crazyegg.com", "optimizely.com", "branch.io",
  "adjust.com", "appsflyer.com", "kochava.com", "bugsnag.com", "sentry.io", "adroll.com", "bluekai.com",
  "demdex.net", "everestech.net", "krxd.net", "omtrdc.net", "rlcdn.com", "tapad.com", "tidaltv.com", "yieldlab.net"
];
const AD_KEYWORDS = ["doubleclick", "adserver", "adservice", "adsystem", "advert", "analytics", "tracker", "tracking", "telemetry"];
function isAdHost(host) {
  host = String(host || "").toLowerCase();
  for (let i = 0; i < AD_DOMAINS.length; i++) if (host === AD_DOMAINS[i] || host.endsWith("." + AD_DOMAINS[i])) return true;
  for (let k = 0; k < AD_KEYWORDS.length; k++) if (host.indexOf(AD_KEYWORDS[k]) >= 0) return true;
  return false;
}
function targetOf(reqUrl) {
  try {
    const u = new URL(reqUrl);
    if (u.pathname.startsWith(__uv$config.prefix)) return __uv$config.decodeUrl(u.pathname.slice(__uv$config.prefix.length));
  } catch (e) { }
  return null;
}

const uv = new UVServiceWorker();

async function handleRequest(event) {
  const target = targetOf(event.request.url);
  if (target) {
    try { if (isAdHost(new URL(target).hostname)) return new Response("", { status: 204 }); } catch (e) { }
  }
  if (uv.route(event)) return await uv.fetch(event);
  return await fetch(event.request);
}

self.addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));