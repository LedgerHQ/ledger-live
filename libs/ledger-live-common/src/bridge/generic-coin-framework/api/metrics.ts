import type { CoinModuleApi, Memo, TxData } from "@ledgerhq/coin-module-framework/api/types";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import {
  apiMethodKeys,
  instrumentApi,
  isNotSupportedStub,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  classifyTransactionError,
  toError,
  type ErrorCategory,
} from "@ledgerhq/transaction-observability";

/**
 * One coin-module method call, as seen at the resolver.
 *
 * Deliberately carries neither the arguments nor the result: both hold addresses, amounts and
 * raw transactions. What is reported is enough to count calls, time them and tell failures
 * apart, per method and per currency.
 */
export type CoinModuleCallEvent = {
  method: string;
  /** The currency id the module was resolved for (e.g. "ripple", "ethereum"). */
  network: string;
  family: string;
  durationMs: number;
  /**
   * `not_supported` is a call to a capability the module omits, answered by the `withDefaults`
   * stub. It is a consumer calling something it should have checked with `supports()`, not a
   * chain failure, so it is kept out of the failure rate.
   */
  status: "success" | "failure" | "not_supported";
  errorName?: string;
  errorCategory?: ErrorCategory;
};

export type CoinModuleCallObserver = (event: CoinModuleCallEvent) => void;

/**
 * Global registry, for the same reason as `setTransactionObserver` in
 * `@ledgerhq/transaction-observability`: the coin-module is resolved through a global, not React
 * context, so a host cannot pass a sink down. Each host registers its observers once at startup,
 * and each observer owns its transmission policy (consent, sampling).
 */
const observers: CoinModuleCallObserver[] = [];

export function setCoinModuleCallObserver(observer: CoinModuleCallObserver): () => void {
  observers.push(observer);
  return () => {
    const index = observers.indexOf(observer);
    if (index !== -1) observers.splice(index, 1);
  };
}

/** Remove all observers. Intended for tests. */
export function resetCoinModuleCallObservers(): void {
  observers.length = 0;
}

function emitCoinModuleCall(event: CoinModuleCallEvent): void {
  for (const observer of observers) {
    try {
      observer(event);
    } catch (error) {
      // A throwing sink must never break the coin-module call it is observing.
      console.warn("coin-module call observer threw", error);
    }
  }
}

/**
 * Methods on the transaction path: called a handful of times per user action, so every call is
 * worth sending. Everything else runs on the sync path — per account, per sync cycle — and is
 * sampled.
 */
const TRANSACTION_PATH_METHODS = new Set([
  "craftTransaction",
  "craftRawTransaction",
  "estimateFees",
  "combine",
  "broadcast",
  "validateIntent",
]);

export const DEFAULT_SYNC_PATH_SAMPLE_RATE = 0.1;

/**
 * Default transmission policy for a sink that leaves the process: every failure and every
 * transaction-path call, and a sample of the sync-path successes. The failure rate stays exact
 * per method; only sync-path volume and latency are estimated from the sample.
 */
export function shouldTransmitCoinModuleCall(
  event: CoinModuleCallEvent,
  { syncPathSampleRate = DEFAULT_SYNC_PATH_SAMPLE_RATE, random = Math.random } = {},
): boolean {
  if (event.status === "failure") return true;
  if (TRANSACTION_PATH_METHODS.has(event.method)) return true;
  return random() < syncPathSampleRate;
}

export type CoinModuleCallTransmissionConfig = {
  /**
   * `false` sends nothing for the sync-path (read) methods, failures included; only the
   * transaction-path calls are left. Distinct from `syncPathSampleRate: 0`, which still sends
   * the read failures.
   */
  includeSyncPath: boolean;
  syncPathSampleRate: number;
  /** Failures sent per method, currency and error name within {@link FAILURE_WINDOW_MS}. */
  maxFailuresPerKey: number;
};

const FAILURE_WINDOW_MS = 60 * 60 * 1000;

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

export const DEFAULT_MAX_FAILURES_PER_KEY = 5;

/**
 * Turns the `coinObservability` flag into a config. Structural, so live-common does not depend on
 * the flag registry; each missing param falls back to its default, since a remote config may turn
 * the flag on without sending any params.
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

/** The current coin observability config, or `null` when the flag is off. */
export function readCoinObservabilityConfig(): CoinModuleCallTransmissionConfig | null {
  return configReader();
}

/**
 * Builds the stateful transmission policy a sink applies: {@link shouldTransmitCoinModuleCall}
 * plus a cap on failures. Without the cap, a node outage makes every active client send a
 * failure per call and per sync cycle; with it, each client sends at most `maxFailuresPerKey`
 * per hour for a given method, currency and error, which still shows the outage and how wide it
 * is. Past the cap the failure rate is therefore a lower bound, not an exact count.
 *
 * `readConfig` is read on every event, so a remote flag change applies at once. Returning `null`
 * disables transmission entirely.
 */
export function createCoinModuleCallTransmitter(
  readConfig: () => CoinModuleCallTransmissionConfig | null,
  { random = Math.random, clock = Date.now } = {},
): (event: CoinModuleCallEvent) => boolean {
  const failures = new Map<string, { count: number; windowStart: number }>();

  return event => {
    const config = readConfig();
    if (!config) return false;
    if (!config.includeSyncPath && !TRANSACTION_PATH_METHODS.has(event.method)) return false;
    if (event.status !== "failure") {
      return shouldTransmitCoinModuleCall(event, {
        syncPathSampleRate: config.syncPathSampleRate,
        random,
      });
    }

    const key = `${event.network}/${event.method}/${event.errorName ?? ""}`;
    const at = clock();
    const entry = failures.get(key);
    if (!entry || at - entry.windowStart >= FAILURE_WINDOW_MS) {
      failures.set(key, { count: 1, windowStart: at });
      return config.maxFailuresPerKey > 0;
    }
    entry.count += 1;
    return entry.count <= config.maxFailuresPerKey;
  };
}

const now = (): number => globalThis.performance?.now() ?? Date.now();

/**
 * Wraps a {@link CoinModuleApi} to report every contract method call to the registered
 * {@link CoinModuleCallObserver}s.
 *
 * Must be applied directly on the `withDefaults` result: the "not supported" stubs are recognised
 * by the tag `notSupported()` puts on them, and any other wrapper replaces those functions with
 * untagged ones.
 */
export function withMetrics<
  C extends CurrencyConfig,
  M extends Memo,
  T extends TxData,
  Extra extends object = Record<never, never>,
>(
  api: CoinModuleApi<C, M, T> & Extra,
  { network, family }: { network: string; family: string },
): CoinModuleApi<C, M, T> & Extra {
  const stubs = new Set<string>(apiMethodKeys.filter(name => isNotSupportedStub(api[name])));

  return instrumentApi(api, (method, fn, args) => {
    if (observers.length === 0) return fn(...args);

    const start = now();
    const report = (error?: unknown) => {
      const event: CoinModuleCallEvent = {
        method,
        network,
        family,
        durationMs: Math.round(now() - start),
        status: "success",
      };
      if (error !== undefined) {
        const err = toError(error);
        event.status = stubs.has(method) ? "not_supported" : "failure";
        event.errorName = err.name;
        if (event.status === "failure") event.errorCategory = classifyTransactionError(err);
      }
      emitCoinModuleCall(event);
    };

    let result: unknown;
    try {
      result = fn(...args);
    } catch (e) {
      report(e);
      throw e;
    }
    if (result instanceof Promise) {
      return result.then(
        v => {
          report();
          return v;
        },
        e => {
          report(e);
          throw e;
        },
      );
    }
    report();
    return result;
  });
}
