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
  /**
   * Accounts derived before their existence is asked, all in the same tick, so that a source with a
   * batch reader checks them in one call. Defaults to 1, the legacy scan.
   */
  readonly window?: number;
  /**
   * Windows in flight at once: with 2, the device derives the next window while the current one is
   * checked. Defaults to 1. Neither option changes the emitted accounts, only how much is wasted
   * past the gap limit.
   */
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

const modeDoneError = () => new DOMException("The derivation mode is done", "AbortError");

/** The account indexes of a mode, in scan order, grouped by window. */
function* windowsOf(mode: DerivationMode, rules: ScanRules, size: number): Generator<number[]> {
  const { startsAt, stopAt, supportsIndex } = scanOf(mode, rules);
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

/**
 * The accounts of a currency, in the order of the legacy `scanAccounts`: mode by mode, index by
 * index, every used account, then the first empty account of a mode that can create one. A mode
 * stops after `mandatoryEmptyAccountSkip` consecutive empty accounts past the first.
 *
 * Derivations go one at a time (the device is serial); existence checks of a window go together.
 * Unsubscribing aborts what is in flight.
 */
export function discoverAccounts(
  host: DiscoveryHost,
  { currencyId, derivationModes, window = 1, lookahead = 1, ...rules }: DiscoverOptions,
): Observable<DiscoveredAccount> {
  return new Observable<DiscoveredAccount>(subscriber => {
    const controller = new AbortController();
    const { signal } = controller;
    let lane: Promise<unknown> = Promise.resolve();

    async function scanMode(currency: CryptoCurrency, mode: DerivationMode): Promise<void> {
      const { mandatoryEmptyAccountSkip } = scanOf(mode, rules);
      const showNewAccount = offersNewAccount(currency, mode, rules);
      let modeDone = false;

      const derive = (candidate: AccountCandidate) => {
        const descriptor = lane.then(() => {
          if (modeDone) throw modeDoneError();
          return host.derive(candidate, signal);
        });
        lane = descriptor.catch(() => undefined);
        return descriptor;
      };

      const probeWindow = async (indexes: number[]): Promise<DiscoveredAccount[]> => {
        const candidates = indexes.map(index => candidateOf(currency, mode, index));
        const descriptors = await Promise.all(candidates.map(derive));
        if (modeDone) throw modeDoneError();
        const used = await Promise.all(descriptors.map(d => host.exists(d, signal)));
        return candidates.map((candidate, i) => ({
          candidate,
          descriptor: descriptors[i],
          used: used[i],
        }));
      };

      const windows = windowsOf(mode, rules, Math.max(1, window));
      const inflight: Promise<DiscoveredAccount[]>[] = [];
      const fill = () => {
        while (inflight.length < Math.max(1, lookahead)) {
          const next = windows.next();
          if (next.done) return;
          const pending = probeWindow(next.value);
          // A window past the stop is never awaited: its rejection must not surface as unhandled.
          pending.catch(() => undefined);
          inflight.push(pending);
        }
      };

      let emptyCount = 0;
      let firstEmptyEmitted = false;
      let first = true;
      try {
        fill();
        for (let pending = inflight.shift(); pending; pending = inflight.shift()) {
          let probes: DiscoveredAccount[];
          try {
            probes = await pending;
          } catch (error) {
            if (first && isUnsupportedDerivation(error)) return;
            throw error;
          }
          first = false;
          for (const probe of probes) {
            if (signal.aborted) return;
            if (probe.used) {
              subscriber.next(probe);
              emptyCount = 0;
              continue;
            }
            if (!firstEmptyEmitted && showNewAccount) {
              subscriber.next(probe);
              firstEmptyEmitted = true;
            }
            if (emptyCount >= mandatoryEmptyAccountSkip) return;
            emptyCount++;
          }
          fill();
        }
      } finally {
        modeDone = true;
      }
    }

    async function main() {
      const currency = findCryptoCurrencyById(currencyId);
      if (!currency) throw new UnknownDiscoveryCurrencyError(`Unknown currency "${currencyId}"`);
      for (const mode of derivationModes ?? derivationModesOf(currency)) {
        if (signal.aborted) return;
        await scanMode(currency, mode);
      }
    }

    main().then(
      () => {
        if (!signal.aborted) subscriber.complete();
      },
      error => {
        if (!signal.aborted) subscriber.error(error);
      },
    );
    return () => controller.abort();
  });
}
