import type { FeatureFlagsReadFailure } from "@shared/feature-flags";
import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import { isDatadogEnabled } from "~/datadog";

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
export function reportFeatureFlagsReadFailure(
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
