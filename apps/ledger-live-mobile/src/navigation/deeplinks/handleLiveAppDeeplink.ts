import { getStateFromPath } from "@react-navigation/native";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { PREDICTIONS_LIVE_APP_ID } from "@features/platform-predictions";

// Not split on "://": a query param can hold a URL, and the cold start keeps the query unencoded.
function toPath(url: URL) {
  return url.href.slice(`${url.protocol}//`.length);
}

export function handleLiveAppDeeplink({
  url,
  hasCompletedOnboarding,
  isLiveAppProviderInitialized,
  localManifests,
  remoteManifests,
  isPredictionsEnabled,
  predictionsManifestId,
  config,
}: {
  url: URL;
  hasCompletedOnboarding: boolean;
  isLiveAppProviderInitialized: boolean;
  localManifests: LiveAppManifest[];
  remoteManifests: LiveAppManifest[];
  isPredictionsEnabled: boolean;
  predictionsManifestId?: string;
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  const isPredictions = url.hostname === "predictions";
  if (isPredictions && !isPredictionsEnabled) return undefined;

  const liveAppId = isPredictions
    ? predictionsManifestId || PREDICTIONS_LIVE_APP_ID
    : url.pathname.split("/")[1];
  if (!hasCompletedOnboarding && !liveAppId.startsWith("protect")) return undefined;

  // On a cold start the manifests aren't loaded yet: the live app screen shows its own error if
  // the app doesn't exist.
  if (!isLiveAppProviderInitialized) {
    return getStateFromPath(toPath(url), config);
  }

  // Local manifests come first, like useLiveAppManifest on the screen the deeplink opens.
  const manifest = [...localManifests, ...remoteManifests].find(
    ({ id }) => id.toLowerCase() === liveAppId.toLowerCase(),
  );
  if (!manifest) return undefined;

  if (isPredictions) return getStateFromPath(toPath(url), config);

  url.pathname = `/${manifest.id}`;
  url.searchParams.set("name", manifest.name);
  return getStateFromPath(toPath(url), config);
}
