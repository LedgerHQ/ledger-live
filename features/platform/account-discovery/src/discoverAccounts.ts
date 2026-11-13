import { Observable } from "rxjs";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountStatus } from "@domain/entity-account-status";
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
import type { DeriveAccount, DiscoveryHost, LookedUpAccount } from "./host";

export type DiscoverOptions = ScanRules & {
  readonly currencyId: string;
  /** Scan only these modes. Defaults to every mode of the currency. */
  readonly derivationModes?: readonly DerivationMode[];
  /** Accounts derived before their status is asked in one tick (one batch call). Defaults to 1. */
  readonly window?: number;
  /** Windows in flight at once, so the device derives the next while one is checked. Defaults to 1. */
  readonly lookahead?: number;
};

export type DiscoveredAccount = {
  readonly descriptor: AccountDescriptor;
  readonly candidate: AccountCandidate;
  /** `used: false` for the first empty account of a mode, offered for the user to create; its gate tells an onboarding first (Canton, Concordium). */
  readonly status: AccountStatus;
};

// By name, as the legacy scan: an error crossing a process boundary loses its prototype.
const isUnsupportedDerivation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === "UnsupportedDerivation";

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

const asLookedUp = (derived: Awaited<ReturnType<DeriveAccount>>): LookedUpAccount | null =>
  derived === null || "descriptor" in derived
    ? derived
    : { descriptor: derived, keyHasMoreAccounts: false };

type Probe = { readonly account: DiscoveredAccount; readonly keyHasMoreAccounts: boolean };

/** Marks a promise the scan may never await (past the gap limit) as handled. */
function handled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => undefined);
  return promise;
}

type Lane = {
  <T>(task: () => Promise<T>): Promise<T>;
  /** Settles once every task queued so far has settled. */
  drained(): Promise<unknown>;
};

/** Runs device tasks one at a time, across modes. */
function createLane(): Lane {
  let tail: Promise<unknown> = Promise.resolve();
  const run = <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(task);
    tail = result.catch(() => undefined);
    return result;
  };
  return Object.assign(run, { drained: () => tail });
}

type ModeContext = {
  readonly host: DiscoveryHost;
  readonly currency: CryptoCurrency;
  readonly mode: DerivationMode;
  readonly signal: AbortSignal;
  readonly onDevice: Lane;
  /** Set once the device answers no account: the mode derives nothing after it. */
  readonly end: { reached: boolean };
};

const assertRunning = (signal: AbortSignal) => {
  if (signal.aborted) throw new ModeDoneError("The derivation mode is done");
};

async function statusOf(
  { host, signal }: ModeContext,
  derived: PromiseSettledResult<LookedUpAccount | null>,
): Promise<AccountStatus | null> {
  if (derived.status === "rejected") throw derived.reason;
  if (derived.value === null) return null;
  assertRunning(signal);
  return host.readStatus(derived.value.descriptor, signal);
}

/** One promise per account of the window, `null` where the mode ends; the status reads start together once all are derived. */
function probeWindow(context: ModeContext, indexes: number[]): Promise<Probe | null>[] {
  const { host, currency, mode, signal, onDevice, end } = context;
  const candidates = indexes.map(index => candidateOf(currency, mode, index));
  const derived = candidates.map(candidate =>
    handled(
      onDevice(async () => {
        assertRunning(signal);
        if (end.reached) return null;
        const lookedUp = asLookedUp(await host.derive(candidate, signal));
        if (lookedUp === null) end.reached = true;
        return lookedUp;
      }),
    ),
  );
  const statuses = Promise.allSettled(derived).then(results =>
    results.map(result => handled(statusOf(context, result))),
  );
  return candidates.map((candidate, i) =>
    handled(
      (async () => {
        const lookedUp = await derived[i];
        if (lookedUp === null) return null;
        const status = await (await statuses)[i];
        return (
          status && {
            account: { candidate, descriptor: lookedUp.descriptor, status },
            keyHasMoreAccounts: lookedUp.keyHasMoreAccounts,
          }
        );
      })(),
    ),
  );
}

/** The legacy gap rule: every used account, the first empty one if offered, until the gap limit; an empty account its key lists more after does not count. */
function createGapRule(gapLimit: number, showNewAccount: boolean) {
  let emptyCount = 0;
  let firstEmptyEmitted = false;
  return ({ account, keyHasMoreAccounts }: Probe): { emit: boolean; stop: boolean } => {
    if (account.status.used) {
      emptyCount = 0;
      return { emit: true, stop: false };
    }
    const emit = !firstEmptyEmitted && showNewAccount;
    if (emit) firstEmptyEmitted = true;
    if (keyHasMoreAccounts) return { emit, stop: false };
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
): Generator<Promise<Probe | null>> {
  const inflight: Promise<Probe | null>[][] = [];
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
        end: { reached: false },
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
          if (emit) subscriber.next(probe.account);
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
    // Ends only once the device is idle: a derivation prefetched by `lookahead` may still be running.
    const settled = scan.then(
      () => onDevice.drained(),
      async (error: unknown) => {
        await onDevice.drained();
        throw error;
      },
    );
    settled.then(
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
