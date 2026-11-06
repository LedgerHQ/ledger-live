import { device } from "detox";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getEnvs } from "@e2e/bridge/server";

/** The live app catalog the running app loads, for this platform and app version. */
export async function fetchLiveAppCatalog(): Promise<LiveAppManifest[]> {
  const { PLATFORM_MANIFEST_API_URL, LEDGER_CLIENT_VERSION } = JSON.parse(await getEnvs());
  const appVersion = LEDGER_CLIENT_VERSION.replace(/^llm-\w+\//, "").replace(/-dev$/, "");
  const catalogUrl = new URL(PLATFORM_MANIFEST_API_URL);
  catalogUrl.searchParams.set("platform", device.getPlatform());
  catalogUrl.searchParams.set("llVersion", appVersion);
  catalogUrl.searchParams.set("lang", "en");
  const response = await fetch(catalogUrl);
  if (!response.ok) {
    throw new Error(`Live app catalog request failed with HTTP ${response.status}`);
  }
  return response.json();
}
