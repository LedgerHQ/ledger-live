import { Observable } from "rxjs";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  candidateOf,
  derivationModesOf,
  offersNewAccount,
  scanOf,
  type AccountCandidate,
  type DerivationMode,
  type ScanRules,
} from "@domain/entity-derivation";
import { UnknownDiscoveryCurrencyError } from "./errors";
import type { DiscoveryHost } from "./host";

export type DiscoverOptions = ScanRules & {
  readonly currencyId: string;
  /** Scan only these modes. Defaults to every mode of the currency. */
  readonly derivationModes?: readonly DerivationMode[];
  /** Accounts derived before their existence is asked in one tick (one batch call). Defaults to 1. */
  readonly window?: number;
  /** Windows in flight at once, so the device derives the next while one is checked. Defaults to 1. */
  readonly lookahead?: number;
};

export type DiscoveredAccount = {
  readonly descriptor: AccountDescriptor;
  readonly candidate: AccountCandidate;
  /** `false` for the first empty account of a mode, offered for the user to create. */
  readonly used: boolean;
};

const isUnsupportedDerivation = (error: unknown) =>
  error instanceof Error && error.name === "UnsupportedDerivation";

class ModeDoneError extends Error {
  override name = "AbortError";
}

/** The account indexes of a mode, in scan order, grouped by window. */
function* windowsOf(
  currency: CryptoCurrency,
  mode: DerivationMode,
  rules: ScanRules,
  size: number,
): Generator<number[]> {
  const { startsAt, stopAt, supportsIndex } = scanOf(currency, mode, rules);
  let window: number[] = [];
  for (let index = startsAt; index < stopAt; index++) {
    if (!supportsIndex(index)) continue;
    window.push(index);
    if (window.length === size) {
      yield window;
      window = [];
    }
  }
  if (window.length > 0) yield window;
}

/** A count option: fractional or non-finite values fall back to whole windows of at least one. */
const atLeastOne = (value: number) => (Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1);

/** Marks a promise the scan may never await (past the gap limit) as handled. */
function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}

/** Runs device tasks one at a time, across modes. */
function createLane() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(task);
    tail = result.catch(() => undefined);
    return result;
  };
}

type ModeContext = {
  readonly host: DiscoveryHost;
  readonly currency: CryptoCurrency;
  readonly mode: DerivationMode;
  readonly signal: AbortSignal;
  readonly onDevice: ReturnType<typeof createLane>;
};

const assertRunning = (signal: AbortSignal) => {
  if (signal.aborted) throw new ModeDoneError("The derivation mode is done");
};

async function existsOf(
  { host, signal }: ModeContext,
  derived: PromiseSettledResult<AccountDescriptor>,
): Promise<boolean> {
  if (derived.status === "rejected") throw derived.reason;
  assertRunning(signal);
  return host.exists(derived.value, signal);
}

/** One promise per account of the window; the existence reads start together once all are derived. */
function probeWindow(context: ModeContext, indexes: number[]): Promise<DiscoveredAccount>[] {
  const { host, currency, mode, signal, onDevice } = context;
  const candidates = indexes.map(index => candidateOf(currency, mode, index));
  const derived = candidates.map(candidate =>
    handled(
      onDevice(() => {
        assertRunning(signal);
        return host.derive(candidate, signal);
      }),
    ),
  );
  const existence = Promise.allSettled(derived).then(results =>
    results.map(result => handled(existsOf(context, result))),
  );
  return candidates.map((candidate, i) =>
    handled(
      Promise.all([derived[i], existence.then(each => each[i])]).then(([descriptor, used]) => ({
        candidate,
        descriptor,
        used,
      })),
    ),
  );
}

/** The legacy gap rule: every used account, the first empty one if offered, until the gap limit. */
function createGapRule(gapLimit: number, showNewAccount: boolean) {
  let emptyCount = 0;
  let firstEmptyEmitted = false;
  return (probe: DiscoveredAccount): { emit: boolean; stop: boolean } => {
    if (probe.used) {
      emptyCount = 0;
      return { emit: true, stop: false };
    }
    const emit = !firstEmptyEmitted && showNewAccount;
    if (emit) firstEmptyEmitted = true;
    if (emptyCount >= gapLimit) return { emit, stop: true };
    emptyCount++;
    return { emit, stop: false };
  };
}

/** The account indexes' outcomes in scan order, keeping `windowsInFlight` windows probed ahead. */
function* probesOf(
  context: ModeContext,
  windows: Generator<number[]>,
  windowsInFlight: number,
): Generator<Promise<DiscoveredAccount>> {
  const inflight: Promise<DiscoveredAccount>[][] = [];
  const fill = () => {
    for (let next = windows.next(); !next.done; next = windows.next()) {
      inflight.push(probeWindow(context, next.value));
      if (inflight.length >= windowsInFlight) return;
    }
  };
  fill();
  for (let probes = inflight.shift(); probes; probes = inflight.shift()) {
    yield* probes;
    fill();
  }
}

/** The accounts of a currency, in the order of the legacy `scanAccounts` (see the README). */
export function discoverAccounts(
  host: DiscoveryHost,
  { currencyId, derivationModes, window = 1, lookahead = 1, ...rules }: DiscoverOptions,
): Observable<DiscoveredAccount> {
  const windowSize = atLeastOne(window);
  const windowsInFlight = atLeastOne(lookahead);
  return new Observable<DiscoveredAccount>(subscriber => {
    const controller = new AbortController();
    const { signal } = controller;
    const onDevice = createLane();

    async function scanMode(currency: CryptoCurrency, mode: DerivationMode): Promise<void> {
      // Ends the mode's requests still in flight once it stops, so the next mode gets the device.
      const modeController = new AbortController();
      const abortMode = () =>
        modeController.abort(new ModeDoneError("The derivation mode is done"));
      signal.addEventListener("abort", abortMode, { once: true });
      const context: ModeContext = {
        host,
        currency,
        mode,
        signal: modeController.signal,
        onDevice,
      };
      const gapRule = createGapRule(
        scanOf(currency, mode, rules).mandatoryEmptyAccountSkip,
        offersNewAccount(currency, mode, rules),
      );
      let first = true;
      try {
        const windows = windowsOf(currency, mode, rules, windowSize);
        for (const pending of probesOf(context, windows, windowsInFlight)) {
          const probe = await pending.catch((error: unknown) => {
            if (first && isUnsupportedDerivation(error)) return undefined;
            throw error;
          });
          if (!probe || signal.aborted) return;
          first = false;
          const { emit, stop } = gapRule(probe);
          if (emit) subscriber.next(probe);
          if (stop) return;
        }
      } finally {
        signal.removeEventListener("abort", abortMode);
        abortMode();
      }
    }

    const scanModes = (currency: CryptoCurrency, modes: readonly DerivationMode[]) =>
      modes.reduce<Promise<void>>(
        (previous, mode) =>
          previous.then(() => (signal.aborted ? undefined : scanMode(currency, mode))),
        Promise.resolve(),
      );

    const currency = findCryptoCurrencyById(currencyId);
    const scan = currency
      ? scanModes(currency, derivationModes ?? derivationModesOf(currency))
      : Promise.reject(new UnknownDiscoveryCurrencyError(`Unknown currency "${currencyId}"`));
    scan.then(
      () => {
        if (!signal.aborted) subscriber.complete();
      },
      (error: unknown) => {
        if (!signal.aborted) subscriber.error(error);
      },
    );
    return () => controller.abort();
  });
}
