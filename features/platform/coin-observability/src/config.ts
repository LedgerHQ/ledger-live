export type CoinModuleCallTransmissionConfig = {
  /**
   * `false` sends nothing for the sync-path (read) methods, failures included; only the
   * transaction-path calls are left. Distinct from `syncPathSampleRate: 0`, which still sends
   * the read failures.
   */
  includeSyncPath: boolean;
  syncPathSampleRate: number;
  /** Failures sent per method, currency and error name within an hour. */
  maxFailuresPerKey: number;
};

export const DEFAULT_SYNC_PATH_SAMPLE_RATE = 0.1;
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
 * Turns the `coinObservability` flag into a config. Structural, so this package does not depend
 * on the flag registry; each missing param falls back to its default, since a remote config may
 * turn the flag on without sending any params.
 */
export function toCoinObservabilityConfig(
  flag:
    | {
        enabled: boolean;
        params?: Partial<CoinModuleCallTransmissionConfig> | null;
      }
    | null
    | undefined,
): CoinModuleCallTransmissionConfig | null {
  if (!flag?.enabled) return null;
  return {
    includeSyncPath: flag.params?.includeSyncPath ?? true,
    syncPathSampleRate: flag.params?.syncPathSampleRate ?? DEFAULT_SYNC_PATH_SAMPLE_RATE,
    maxFailuresPerKey: flag.params?.maxFailuresPerKey ?? DEFAULT_MAX_FAILURES_PER_KEY,
  };
}
