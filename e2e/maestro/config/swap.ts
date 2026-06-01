// Manifest id of the swap live app. Doubles as the WebView driver name
// (context.ts) and the ptxSwapLiveAppMobile `manifest_id` flag (swapEthUsdt
// spec). Staging by default; PRODUCTION=true targets the prod manifest.
export const SWAP_LIVE_APP_MANIFEST_ID =
  process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws";
