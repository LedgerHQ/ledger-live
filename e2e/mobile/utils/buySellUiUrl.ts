import { device, log } from "detox";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getEnvs, importLocalManifests } from "@e2e/bridge/server";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

const isBuySellUiManifest = ({ id }: LiveAppManifest) =>
  id === BUY_SELL_UI_APP_ID || id.startsWith(`${BUY_SELL_UI_APP_ID}-`);

/**
 * Points Buy/Sell at `BUY_SELL_UI_URL` (a buy-sell-ui PR preview, localhost, ...): every buy-sell-ui
 * catalog manifest is sent back as a local manifest loading that URL.
 */
export async function applyBuySellUiUrl(): Promise<void> {
  const url = process.env.BUY_SELL_UI_URL?.trim();
  if (!url) return;

  const { hostname, port, protocol, origin } = new URL(url);
  if (device.getPlatform() === "android" && LOOPBACK_HOSTS.has(hostname)) {
    await device.reverseTcpPort(Number(port) || (protocol === "https:" ? 443 : 80));
  }

  const { PLATFORM_MANIFEST_API_URL } = JSON.parse(await getEnvs());
  const response = await fetch(PLATFORM_MANIFEST_API_URL);
  if (!response.ok) {
    throw new Error(`BUY_SELL_UI_URL: catalog request failed with HTTP ${response.status}`);
  }
  const catalog: LiveAppManifest[] = await response.json();
  const manifests = catalog.filter(isBuySellUiManifest);
  if (!manifests.length) {
    throw new Error(`BUY_SELL_UI_URL: no "${BUY_SELL_UI_APP_ID}" manifest in the catalog`);
  }

  await importLocalManifests(
    manifests.map(manifest => ({
      ...manifest,
      url,
      homepageUrl: url,
      domains: [...manifest.domains, origin],
    })),
  );
  const ids = manifests.map(({ id }) => id).join(", ");
  log.info(`[E2E] Buy/Sell manifests ${ids} now load ${url}`);
}
