const express = require("express");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");

const PORT = process.env.PORT || 10000;
const UPSTREAM = process.env.UPSTREAM || "https://shapeshift-proxy-staging.davepicozzi.workers.dev";

const app = express();

// Let Express trust Render's proxy so req.secure works
app.set("trust proxy", 1);

// Enforce HTTPS (redirect HTTP -> HTTPS)
app.use((req, res, next) => {
  // If already secure, continue
  if (req.secure || req.headers["x-forwarded-proto"] === "https") return next();
  // 301/308 permanent redirect to HTTPS
  const host = req.headers.host;
  const url = `https://${host}${req.originalUrl || req.url}`;
  return res.redirect(308, url);
});

app.use(helmet({
  contentSecurityPolicy: false,
  referrerPolicy: { policy: "no-referrer" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

// Health check
app.get("/_health", (req, res) => res.json({ ok: true, upstream: UPSTREAM }));

// Proxy everything to the Worker
app.use("/", createProxyMiddleware({
  target: UPSTREAM,
  changeOrigin: true,
  xfwd: true,
  secure: true
}));

app.listen(PORT, () => {
  console.log(`Proxy on :${PORT}, upstream=${UPSTREAM}`);
});
