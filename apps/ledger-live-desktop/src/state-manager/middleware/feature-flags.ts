import { getEnv } from "@shared/env";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import type { State } from "~/renderer/reducers";
import { languageSelector } from "~/renderer/reducers/settings";
import {
  fetchRemoteFlags as defaultFetchRemoteFlags,
  readCachedFlags as defaultReadCachedFlags,
} from "~/firebase/remoteConfig";
import { reportFeatureFlagsReadFailure } from "./reportFeatureFlagsReadFailure";

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
