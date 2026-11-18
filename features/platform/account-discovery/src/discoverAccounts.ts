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
  "name" in error &&
  error.name === "UnsupportedDerivation";

const asLookedUp = (derived: Awaited<ReturnType<DeriveAccount>>): LookedUpAccount | null =>
  derived === null || "descriptor" in derived
    ? derived
    : { descriptor: derived, keyHasMoreAccounts: false };

/** The legacy gap rule: every used account, the first empty one if offered, until the gap limit; an empty account its key lists more after does not count. */
function createGapRule(gapLimit: number, showNewAccount: boolean) {
  let emptyCount = 0;
  let firstEmptyEmitted = false;
  const stopsIfEmpty = (keyHasMoreAccounts: boolean) =>
    !keyHasMoreAccounts && emptyCount >= gapLimit;
  return {
    stopsIfEmpty,
    settle(used: boolean, keyHasMoreAccounts: boolean): { emit: boolean; stop: boolean } {
      if (used) {
        emptyCount = 0;
        return { emit: true, stop: false };
      }
      const emit = showNewAccount && !firstEmptyEmitted;
      firstEmptyEmitted = true;
      const stop = stopsIfEmpty(keyHasMoreAccounts);
      if (!keyHasMoreAccounts && !stop) emptyCount++;
      return { emit, stop };
    },
  };
}

/** The accounts of a currency, in the order of the legacy `scanAccounts` (see the README). */
export function discoverAccounts(
  host: DiscoveryHost,
  { currencyId, derivationModes, ...rules }: DiscoverOptions,
): Observable<DiscoveredAccount> {
  return new Observable<DiscoveredAccount>(subscriber => {
    const controller = new AbortController();
    const { signal } = controller;

    async function scanMode(currency: CryptoCurrency, mode: DerivationMode): Promise<void> {
      const modeController = new AbortController();
      const abortMode = () => modeController.abort();
      signal.addEventListener("abort", abortMode, { once: true });
      const scan = scanOf(currency, mode, rules);
      const indexes = Array.from(
        { length: scan.stopAt - scan.startsAt },
        (_, i) => scan.startsAt + i,
      ).filter(scan.supportsIndex);
      const gapRule = createGapRule(
        scan.mandatoryEmptyAccountSkip,
        offersNewAccount(currency, mode, rules),
      );
      const deriveAt = (index: number) => {
        const candidate = candidateOf(currency, mode, index);
        // Async, so a host throwing synchronously fails here like a rejection, once the scan reaches it.
        const lookedUp = (async () =>
          asLookedUp(await host.derive(candidate, modeController.signal)))();
        // A prefetch can reject before the scan awaits it.
        lookedUp.catch(() => undefined);
        return { candidate, lookedUp };
      };
      let prefetched: ReturnType<typeof deriveAt> | undefined;
      let first = true;
      try {
        for (const [position, index] of indexes.entries()) {
          const { candidate, lookedUp: deriving } = prefetched ?? deriveAt(index);
          prefetched = undefined;
          const lookedUp = await deriving;
          if (!lookedUp || signal.aborted) return;
          const { descriptor, keyHasMoreAccounts } = lookedUp;
          const next = indexes.at(position + 1);
          // Even an empty account here cannot stop the mode: the legacy scan derives the next one too.
          if (next !== undefined && !gapRule.stopsIfEmpty(keyHasMoreAccounts)) {
            prefetched = deriveAt(next);
          }
          const status = await host.readStatus(descriptor, modeController.signal);
          if (signal.aborted) return;
          first = false;
          const { emit, stop } = gapRule.settle(status.used, keyHasMoreAccounts);
          if (emit) subscriber.next({ candidate, descriptor, status });
          // A subscriber can unsubscribe while handling an account.
          if (stop || signal.aborted) return;
        }
      } catch (error) {
        if (!(first && isUnsupportedDerivation(error))) throw error;
      } finally {
        signal.removeEventListener("abort", abortMode);
        abortMode();
        // The next mode and the end of the scan wait for the device to be idle.
        await prefetched?.lookedUp.catch(() => undefined);
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
      ? scanModes(currency, derivationModes ?? derivationModesOf(currency, rules))
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
