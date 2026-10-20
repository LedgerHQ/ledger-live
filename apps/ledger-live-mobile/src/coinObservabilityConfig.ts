import {
  toCoinObservabilityConfig,
  type CoinModuleCallTransmissionConfig,
} from "@features/platform-coin-observability";

type Flag = Parameters<typeof toCoinObservabilityConfig>[0];

/**
 * The coin observability config for mobile, or `null` when nothing may be sent.
 *
 * Mobile grants Datadog's SDK consent from the analytics opt-in, and the bug-reporting opt-in only
 * filters RUM errors; no log mapper checks it. Without this gate, a user who accepts analytics but
 * declines bug reporting would still send these logs. Desktop gets the equivalent from the
 * crash-reporting check in its `beforeSend`.
 */
export function coinObservabilityConfigFor({
  bugReportingEnabled,
  datadogEnabled,
  coinObservability,
}: {
  bugReportingEnabled: boolean;
  datadogEnabled: boolean;
  coinObservability: Flag;
}): CoinModuleCallTransmissionConfig | null {
  if (!bugReportingEnabled || !datadogEnabled) return null;
  return toCoinObservabilityConfig(coinObservability);
}
