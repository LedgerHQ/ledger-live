import { getEnv } from "@shared/env";
import {
  createFeatureFlagsMiddleware,
  type FeatureFlagsReadFailure,
  type PartialFeatures,
} from "@shared/feature-flags";
import appLogger from "~/renderer/logger";
import type { State } from "~/renderer/reducers";
import { languageSelector } from "~/renderer/reducers/settings";
import {
  fetchRemoteFlags as defaultFetchRemoteFlags,
  readCachedFlags as defaultReadCachedFlags,
} from "~/firebase/remoteConfig";

export type FeatureFlagsSources = {
  /**
   * Remote-flags fetcher driving the polling loop. Defaults to the Firebase fetcher.
   * Pass `null` to disable polling (e.g. unit tests, which must not hit a live backend).
   */
  fetchRemoteFlags?: (() => Promise<PartialFeatures>) | null;
  /**
   * Network-free read of the flags Firebase already cached on this device, used to prime the
   * slice before the first fetch. Defaults to the Firebase reader, or to `null` when
   * `fetchRemoteFlags` is explicitly disabled, so opting out of the backend opts out of the
   * whole Firebase path. Pass `null` to disable it on its own.
   */
  readCachedFlags?: (() => Promise<PartialFeatures>) | null;
};

/**
 * Reports only the failures that actually degrade the session. A warm failure is routine: the
 * previously read values stay in place and the next poll retries. A cold one means the app is
 * running on compiled defaults, which is a misconfigured session rather than a passing network
 * blip, and is precisely the signal whose absence let a staging leak run unnoticed for a whole
 * release cycle.
 *
 * `logger.critical` rather than a bare console call: it is the one path wired to Datadog
 * (breadcrumb plus `captureException`), so a cold boot becomes searchable instead of invisible.
 *
 * A `sync` failure is a bug whatever `isCold` says, so it is reported, but only at boot: a later
 * poll would repeat the same failure every interval.
 */
function reportFeatureFlagsReadFailure(
  error: unknown,
  { stage, attempt, isCold }: FeatureFlagsReadFailure,
) {
  if (stage === "sync") {
    if (attempt !== 1) return;
    appLogger.critical(
      error,
      "Feature flags: re-resolution failed at boot, running on compiled defaults",
    );
    return;
  }
  if (!isCold) return;
  appLogger.critical(error, `Feature flags: ${stage} read failed, resolving on compiled defaults`);
}

export function createDesktopFeatureFlagsMiddleware({
  fetchRemoteFlags = defaultFetchRemoteFlags,
  readCachedFlags = fetchRemoteFlags === null ? null : defaultReadCachedFlags,
}: FeatureFlagsSources = {}) {
  return createFeatureFlagsMiddleware<State>({
    resolutionConfig: {
      platform: "desktop",
      appVersion: __APP_VERSION__,
      envFlags: getEnv("FEATURE_FLAGS") as PartialFeatures,
    },
    readCachedFlags: readCachedFlags ?? undefined,
    fetchRemoteFlags: fetchRemoteFlags ?? undefined,
    getAppLanguage: languageSelector,
    onRemoteFlagsError: reportFeatureFlagsReadFailure,
  });
}
