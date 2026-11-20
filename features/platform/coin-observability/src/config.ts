import { toMethodTiers, type MethodTiers } from "./tiers";

export type CoinModuleCallTransmissionConfig = {
  /**
   * `false` sends nothing for the `sync` tier, failures included; the transaction and preparation
   * calls are left. Distinct from `syncPathSampleRate: 0`, which still sends the sync failures.
   */
  includeSyncPath: boolean;
  /** Share of app sessions that send their `sync`-tier successes. */
  syncPathSampleRate: number;
  /** Share of app sessions that send their `preparation`-tier successes. */
  preparationSampleRate: number;
  /** Failures sent per method, currency and error name within an hour. */
  maxFailuresPerKey: number;
  /**
   * Moves a method to another tier (`transaction`, `preparation`, `sync` or `off`) over
   * `DEFAULT_METHOD_TIERS`, without a release.
   */
  methodTiers?: MethodTiers;
};

export const DEFAULT_SYNC_PATH_SAMPLE_RATE = 0.1;
export const DEFAULT_PREPARATION_SAMPLE_RATE = 0.1;
export const DEFAULT_MAX_FAILURES_PER_KEY = 5;

/**
 * The hosts' `coinObservability` flag, injected at boot. The observers are registered at module
 * load, before the store exists, so they cannot read the flag themselves; same pattern as
 * `setEarnTxLifecycleFlagReader`. Until a reader is set, transmission stays off.
 */
let configReader: () => CoinModuleCallTransmissionConfig | null = () => null;

export function setCoinObservabilityConfigReader(
  reader: (() => CoinModuleCallTransmissionConfig | null) | null,
): void {
  configReader = reader ?? (() => null);
}

/** The current coin observability config, or `null` when the flag is off. */
export function readCoinObservabilityConfig(): CoinModuleCallTransmissionConfig | null {
  return configReader();
}

/**
 * The config a host injects with {@link setCoinObservabilityConfigReader}: `null` unless the user
 * opted in, Datadog's own flag is on and `coinObservability` is on.
 *
 * Both hosts need all three on every read. Datadog's flag is only checked when the SDK is
 * initialised, so turning it off mid-session does not stop logs already flowing; and the consent
 * the SDK enforces is not always the one these logs answer to (mobile grants SDK consent from the
 * analytics opt-in, while these logs belong to the crash/bug-reporting opt-in).
 */
export function coinObservabilityConfigFor({
  consentGranted,
  datadogEnabled,
  coinObservability,
}: {
  /** The crash-reporting (desktop) or bug-reporting (mobile) opt-in. */
  consentGranted: boolean;
  /** `lldDatadog` or `llmDatadog`. */
  datadogEnabled: boolean;
  coinObservability: Parameters<typeof toCoinObservabilityConfig>[0];
}): CoinModuleCallTransmissionConfig | null {
  if (!consentGranted || !datadogEnabled) return null;
  return toCoinObservabilityConfig(coinObservability);
}

/**
 * Turns the `coinObservability` flag into a config. Structural, so this package does not depend
 * on the flag registry; each missing param falls back to its default, since a remote config may
 * turn the flag on without sending any params. `methodTiers` keeps only its entries that name a
 * known tier.
 */
export function toCoinObservabilityConfig(
  flag:
    | {
        enabled: boolean;
        params?:
          | (Partial<Omit<CoinModuleCallTransmissionConfig, "methodTiers">> & {
              methodTiers?: unknown;
            })
          | null;
      }
    | null
    | undefined,
): CoinModuleCallTransmissionConfig | null {
  if (!flag?.enabled) return null;
  return {
    includeSyncPath: flag.params?.includeSyncPath ?? true,
    syncPathSampleRate: flag.params?.syncPathSampleRate ?? DEFAULT_SYNC_PATH_SAMPLE_RATE,
    preparationSampleRate: flag.params?.preparationSampleRate ?? DEFAULT_PREPARATION_SAMPLE_RATE,
    maxFailuresPerKey: flag.params?.maxFailuresPerKey ?? DEFAULT_MAX_FAILURES_PER_KEY,
    methodTiers: toMethodTiers(flag.params?.methodTiers),
  };
}
