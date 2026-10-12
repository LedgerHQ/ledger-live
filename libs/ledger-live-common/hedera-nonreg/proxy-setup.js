// Only matters behind an HTTPS proxy (e.g. a sandbox): routes fetch (undici) and axios through it
// with CONNECT tunnels, as axios' own proxy support aborts large HTTPS bodies there.
const path = require("path");

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;

if (proxyUrl) {
  const pnpm = path.resolve(__dirname, "../../../node_modules/.pnpm");
  const { setGlobalDispatcher, EnvHttpProxyAgent } = require(
    path.join(pnpm, "undici@7.18.2/node_modules/undici/index.js"),
  );
  setGlobalDispatcher(new EnvHttpProxyAgent());

  const { HttpsProxyAgent } = require(
    path.join(pnpm, "https-proxy-agent@7.0.6/node_modules/https-proxy-agent"),
  );
  const liveNetwork = path.dirname(require.resolve("@ledgerhq/live-network/package.json"));
  const axios = require(require.resolve("axios", { paths: [liveNetwork] }));
  const agent = new HttpsProxyAgent(proxyUrl, { keepAlive: true });
  axios.interceptors.request.use(config => ({ ...config, proxy: false, httpsAgent: agent }));
}
