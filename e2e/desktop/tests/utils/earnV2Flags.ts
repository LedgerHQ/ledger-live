import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";


export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const EARN_V2_DESKTOP_FLAGS: OptionalFeatureMap = {
  ...(useLocalEarnManifest && { ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-local-manifest" } } }),
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
  lwdWallet40: {
    enabled: true,
    params: { marketBanner: true, graphRework: true, quickActionCtas: true },
  },
};

/**
 * Local manifest override for the Earn live app.
 * When injected, this manifest takes priority over the remote one.
 * Toggle on/off via the `USE_LOCAL_EARN_MANIFEST` env var (defaults to off).
 *
 * Usage: USE_LOCAL_EARN_MANIFEST=1 pnpm e2e:desktop ...
 */
export const EARN_LOCAL_MANIFEST: LiveAppManifest = {
  id: "earn-local-manifest",
  name: "Earn",
  url: "http://localhost:3000",
  homepageUrl: "http://localhost:3000",
  icon: "",
  platforms: ["ios", "android", "desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "1",
  branch: "stable",
  categories: ["earn"],
  currencies: "*",
  visibility: "complete",
  content: {
    shortDescription: { en: "Earn dashboard" },
    description: { en: "Earn dashboard" },
  },
  permissions: [
    "account.list",
    "account.receive",
    "account.request",
    "currency.list",
    "custom.getTransactionByHash",
    "device.close",
    "device.exchange",
    "device.transport",
    "message.sign",
    "transaction.sign",
    "transaction.signAndBroadcast",
    "storage.set",
    "storage.get",
    "bitcoin.getXPub",
    "wallet.capabilities",
    "wallet.userId",
    "wallet.info",
    "custom.isReady",
    "custom.earn.isReady",
    "custom.getFunds",
    "custom.navigate",
    "custom.getAccountIdFormats",
  ],
  domains: ["http://localhost:3000", "https://*"],
};

