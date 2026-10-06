import { Observable } from "rxjs";
import { networkFromCurrencyId, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  accountLevelPathOf,
  accountPathOf,
  derivationModesOf,
  derivationSchemeOf,
  offersNewAccount,
  scanRulesOf,
  type DerivationMode,
  type DerivationRules,
} from "./derivationModes";

/** What the host is asked to derive: the key of one account, at the path the scheme gives. */
export type DeriveRequest = {
  readonly currencyId: string;
  readonly derivationMode: DerivationMode;
  readonly index: number;
  /** The full path of the account's address, e.g. `44'/60'/0'/0/3`. */
  readonly path: string;
  /** The account-level path, e.g. `84'/0'/2'`: where an extended public key is derived. */
  readonly accountPath: string;
};

/** The key an account is known by: the xpub for a UTXO account, the address otherwise. */
export type DerivedKey =
  | { readonly type: "utxo"; readonly xpub: string }
  | { readonly type: "address"; readonly address: string };

export type DiscoveryPorts = {
  /**
   * Derives the key of an account, on the device. Throws an error named `UnsupportedDerivation`
   * when the device app has no such mode: the mode is then skipped, as the legacy scan did.
   */
  derive(request: DeriveRequest, signal?: AbortSignal): Promise<DerivedKey>;
  /** Whether the account has any history. See `AccountDataSource.exists`. */
  exists(descriptor: AccountDescriptor, signal?: AbortSignal): Promise<boolean>;
};

export type DiscoverOptions = DerivationRules & {
  readonly currencyId: string;
  /** Scan only these modes. Defaults to every mode of the currency. */
  readonly derivationModes?: readonly DerivationMode[];
  /**
   * How many accounts of a mode are checked ahead of the one being decided. Derivations stay one at
   * a time (the device is serial); the existence checks overlap. The emitted accounts do not depend
   * on it: only how many checks are wasted past the gap limit. Defaults to 1, the legacy scan.
   */
  readonly lookahead?: number;
};

export type DiscoveredAccount = {
  readonly descriptor: AccountDescriptor;
  readonly derivationMode: DerivationMode;
  readonly index: number;
  /** `false` for the first empty account of a mode, offered for the user to create. */
  readonly used: boolean;
};

type Probe = { index: number; descriptor: AccountDescriptor; used: boolean };

function isUnsupportedDerivation(error: unknown): boolean {
  return error instanceof Error && error.name === "UnsupportedDerivation";
}

/**
 * Discovers the accounts of a currency, one `DiscoveredAccount` at a time, in the order of the
 * legacy `scanAccounts`: mode by mode, index by index, every used account, and the first empty
 * account of a mode when that mode offers a new one. A mode stops after `mandatoryEmptyAccountSkip`
 * consecutive empty accounts past the first.
 *
 * Unsubscribing aborts what is in flight.
 */
export function discoverAccounts(
  ports: DiscoveryPorts,
  { currencyId, derivationModes, lookahead = 1, ...rules }: DiscoverOptions,
): Observable<DiscoveredAccount> {
  return new Observable<DiscoveredAccount>(subscriber => {
    const controller = new AbortController();
    const { signal } = controller;

    async function scanMode(currency: CryptoCurrency, mode: DerivationMode): Promise<void> {
      const { coinType } = currency;
      const scheme = derivationSchemeOf(currency, mode);
      const network = networkFromCurrencyId(currencyId);
      const { startsAt, stopAt, mandatoryEmptyAccountSkip, supportsIndex } = scanRulesOf(
        mode,
        rules,
      );
      const showNewAccount = offersNewAccount(currency, mode, rules);

      // Checks queued past the end of the mode are dropped before they reach a port.
      let modeDone = false;
      const abortIfDone = () => {
        if (modeDone) throw new DOMException("the mode is done", "AbortError");
      };

      // Derivations go through one lane: the device answers one request at a time.
      let lane: Promise<unknown> = Promise.resolve();
      const derive = (request: DeriveRequest) => {
        const answer = lane.then(() => {
          abortIfDone();
          return ports.derive(request, signal);
        });
        lane = answer.catch(() => undefined);
        return answer;
      };

      const probe = async (index: number): Promise<Probe> => {
        const key = await derive({
          currencyId,
          derivationMode: mode,
          index,
          path: accountPathOf(scheme, coinType, index),
          accountPath: accountLevelPathOf(scheme, coinType, index),
        });
        const descriptor: AccountDescriptor =
          key.type === "utxo"
            ? {
                purpose: "account",
                version: "1",
                type: "utxo",
                network,
                xpub: key.xpub,
                path: toDescriptorPath(accountLevelPathOf(scheme, coinType, index)),
              }
            : {
                purpose: "account",
                version: "1",
                type: "address",
                network,
                address: key.address,
                path: toDescriptorPath(accountPathOf(scheme, coinType, index)),
              };
        abortIfDone();
        return { index, descriptor, used: await ports.exists(descriptor, signal) };
      };

      const inflight: Promise<Probe>[] = [];
      let next = startsAt;
      const fill = () => {
        while (inflight.length < Math.max(1, lookahead) && next < stopAt) {
          const index = next++;
          if (!supportsIndex(index)) continue;
          const pending = probe(index);
          // A probe that is never awaited (past the stop) must not surface as unhandled.
          pending.catch(() => undefined);
          inflight.push(pending);
        }
      };

      try {
        let emptyCount = 0;
        let firstEmptyEmitted = false;
        let first = true;
        fill();
        while (inflight.length > 0) {
          const pending = inflight.shift();
          if (!pending) break;
          let result: Probe;
          try {
            result = await pending;
          } catch (error) {
            // The device has no such mode: nothing to scan, the next mode may still be.
            if (first && isUnsupportedDerivation(error)) return;
            throw error;
          }
          first = false;
          if (signal.aborted) return;

          const { index, descriptor, used } = result;
          if (used) {
            subscriber.next({ descriptor, derivationMode: mode, index, used });
            emptyCount = 0;
          } else {
            if (!firstEmptyEmitted && showNewAccount) {
              subscriber.next({ descriptor, derivationMode: mode, index, used });
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
      if (!currency) throw new Error(`Unknown currency "${currencyId}"`);
      const modes = derivationModes ?? derivationModesOf(currency);
      for (const mode of modes) {
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

function toDescriptorPath(schemePath: string): string {
  return "m/" + schemePath.replaceAll("'", "h");
}
