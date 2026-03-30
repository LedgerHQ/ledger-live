import { getStateFromPath } from "@react-navigation/native";
import { handleWallet40Deeplink } from "../handleWallet40Deeplink";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://discover/:platform` and `ledgerlive://recover/:platform`
 * as well as `ledgerlive://discover` (no platform) in Wallet 4.0.
 *
 * - Validates that a matching live-app manifest exists before navigating.
 * - Falls through to the static linking config on cold start (provider not ready yet).
 * - Defers to handleWallet40Deeplink for the no-platform discover route in W40.
 */
export const discoverHandler: DeeplinkHandler = (
  { hostname, platform, url, rawPath },
  {
    config,
    hasCompletedOnboarding,
    liveAppProviderInitialized,
    manifests,
    shouldDisplayWallet40MainNav,
  },
) => {
  // Wallet 4.0: discover without a platform sub-path uses a different nav structure
  if (!platform && shouldDisplayWallet40MainNav) {
    return handleWallet40Deeplink(hostname, platform, {});
  }

  if (!platform) {
    return getStateFromPath(rawPath, config);
  }

  if (!hasCompletedOnboarding && !platform.startsWith("protect")) return undefined;

  /**
   * Upstream validation of "ledgerlive://discover/:platform":
   *  - checking that a manifest exists
   *  - adding "name" search param
   * */
  if (!liveAppProviderInitialized) {
    /**
     * The provider isn't initialized yet so the manifest will possibly
     * not be found.
     * We redirect because this scenario happens when deep linking
     * triggers a cold app start. The platform app screen will show an
     * error in case the app isn't found.
     */
    return getStateFromPath(rawPath, config);
  }

  const manifest = manifests.find(m => m.id.toLowerCase() === platform.toLowerCase());
  if (!manifest) return undefined;

  url.pathname = `/${manifest.id}`;
  url.searchParams.set("name", manifest.name);
  return getStateFromPath(url.href?.split("://")[1], config);
};
