import { getStateFromPath } from "@react-navigation/native";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { PREDICTIONS_LIVE_APP_ID } from "@features/platform-predictions";

// Not split on "://": a query param can hold a URL, and the cold start keeps the query unencoded.
function toPath(url: URL) {
  return url.href.slice(`${url.protocol}//`.length);
}

function toDiscoverUrl(url: URL) {
  if (url.hostname !== "predictions") return url;
  return new URL(`ledgerwallet://discover/${PREDICTIONS_LIVE_APP_ID}${url.search}`);
}

export function handleLiveAppDeeplink({
  url,
  hasCompletedOnboarding,
  isLiveAppProviderInitialized,
  localManifests,
  remoteManifests,
  config,
}: {
  url: URL;
  hasCompletedOnboarding: boolean;
  isLiveAppProviderInitialized: boolean;
  localManifests: LiveAppManifest[];
  remoteManifests: LiveAppManifest[];
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  const liveAppUrl = toDiscoverUrl(url);
  const liveAppId = liveAppUrl.pathname.split("/")[1];
  if (!hasCompletedOnboarding && !liveAppId.startsWith("protect")) return undefined;

  // On a cold start the manifests aren't loaded yet: the live app screen shows its own error if
  // the app doesn't exist.
  if (!isLiveAppProviderInitialized) {
    return getStateFromPath(toPath(liveAppUrl), config);
  }

  // Local manifests come first, like useLiveAppManifest on the screen the deeplink opens.
  const manifest = [...localManifests, ...remoteManifests].find(
    ({ id }) => id.toLowerCase() === liveAppId.toLowerCase(),
  );
  if (!manifest) return undefined;

  liveAppUrl.pathname = `/${manifest.id}`;
  liveAppUrl.searchParams.set("name", manifest.name);
  return getStateFromPath(toPath(liveAppUrl), config);
}
