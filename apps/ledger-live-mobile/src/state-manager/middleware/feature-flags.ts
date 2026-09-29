import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import { getEnv } from "@shared/env";
import {
  createFeatureFlagsMiddleware,
  type FeatureFlagsReadFailure,
  type PartialFeatures,
} from "@shared/feature-flags";
import { isDatadogEnabled } from "~/datadog";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import { languageSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

/**
 * Reports only the failures that actually degrade the session. A warm failure is routine: the
 * previously read values stay in place and the next poll retries. A cold one means the app is
 * running on compiled defaults, which is a misconfigured session rather than a passing network
 * blip, and is precisely the signal whose absence let a staging leak run unnoticed for a whole
 * release cycle.
 *
 * `console.error` because it is the level the monitoring tools intercept. Deliberately not the
 * app's `logger.critical`, which despite its name falls back to `console.log` outside
 * `DEBUG_ERROR` builds and so would make this *less* visible than a plain warning. Desktop uses
 * `logger.critical` instead, because there it really is the Datadog path.
 *
 * A `sync` failure is a bug whatever `isCold` says, so it is reported, but only at boot: a later
 * poll would repeat the same failure every interval. Boot is before Datadog is initialized and
 * starts intercepting `console.error`, hence the explicit `DdRum.addError`, which the SDK buffers
 * until initialization.
 */
function reportFeatureFlagsReadFailure(
  error: unknown,
  { stage, attempt, isCold }: FeatureFlagsReadFailure,
) {
  if (stage === "sync") {
    if (attempt !== 1) return;
    const message = "Feature flags: re-resolution failed at boot, running on compiled defaults";
    console.error(message, error);
    if (isDatadogEnabled) {
      DdRum.addError(
        message,
        ErrorSource.SOURCE,
        error instanceof Error ? (error.stack ?? "") : "",
      );
    }
    return;
  }
  if (!isCold) return;
  console.error(`Feature flags: ${stage} read failed, resolving on compiled defaults`, error);
}

export function createMobileFeatureFlagsMiddleware() {
  return createFeatureFlagsMiddleware<State>({
    resolutionConfig: {
      platform: Platform.OS === "ios" ? "ios" : "android",
      appVersion: VersionNumber.appVersion ?? undefined,
      envFlags: getEnv("FEATURE_FLAGS") as PartialFeatures,
    },
    readCachedFlags,
    fetchRemoteFlags,
    getAppLanguage: languageSelector,
    onRemoteFlagsError: reportFeatureFlagsReadFailure,
  });
}
