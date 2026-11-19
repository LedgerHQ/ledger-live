import type { CoinModuleApi, Memo, TxData } from "@ledgerhq/coin-module-framework/api/types";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import {
  apiMethodKeys,
  instrumentApi,
  isNotSupportedStub,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  emitCoinModuleCall,
  hasCoinModuleCallObservers,
  type CoinModuleCallEvent,
} from "@features/platform-coin-observability";
import {
  classifyTransactionError,
  sanitizeErrorMessage,
  toError,
} from "@ledgerhq/transaction-observability";

const now = (): number => globalThis.performance?.now() ?? Date.now();

/**
 * Wraps a {@link CoinModuleApi} to report every contract method call to the observers registered
 * in `@features/platform-coin-observability`. Only this adapter lives here, at the resolver; the
 * event, the registry and the transmission policy belong to that package.
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
    if (!hasCoinModuleCallObservers()) return fn(...args);

    const start = now();
    // The outcome is passed explicitly: a method may throw or reject with `undefined`, which is
    // still a failure for the caller and must not be counted as a success.
    const report = (outcome: { failed: false } | { failed: true; error: unknown }) => {
      const event: CoinModuleCallEvent = {
        method,
        network,
        family,
        durationMs: Math.round(now() - start),
        status: "success",
      };
      if (outcome.failed) {
        const err = toError(outcome.error);
        event.status = stubs.has(method) ? "not_supported" : "failure";
        event.errorName = err.name;
        event.errorMessage = sanitizeErrorMessage(err.message);
        if (event.status === "failure") event.errorCategory = classifyTransactionError(err);
      }
      emitCoinModuleCall(event);
    };

    let result: unknown;
    try {
      result = fn(...args);
    } catch (e) {
      report({ failed: true, error: e });
      throw e;
    }
    if (result instanceof Promise) {
      return result.then(
        v => {
          report({ failed: false });
          return v;
        },
        e => {
          report({ failed: true, error: e });
          throw e;
        },
      );
    }
    report({ failed: false });
    return result;
  });
}
