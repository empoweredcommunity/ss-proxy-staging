const express = require("express");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");

const PORT = process.env.PORT || 10000;
// Upstream = your Cloudflare Worker (staging)
const UPSTREAM = process.env.UPSTREAM || "https://shapeshift-proxy-staging.davepicozzi.workers.dev";

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: "no-referrer" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

// Simple health
app.get("/_health", (req, res) => res.json({ ok: true, upstream: UPSTREAM }));

// Proxy EVERYTHING to the Worker
app.use("/", createProxyMiddleware({
  target: UPSTREAM,
  changeOrigin: true,  // send Host as workers.dev
  xfwd: true,          // X-Forwarded-* headers
  secure: true
}));

app.listen(PORT, () => {
  console.log(`Proxy on :${PORT}, upstream=${UPSTREAM}`);
});
