import type { FeatureFlagsReadFailure } from "@shared/feature-flags";
import appLogger from "~/renderer/logger";

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
export function reportFeatureFlagsReadFailure(
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
