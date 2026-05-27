import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, CurrencyBridge, ScanAccountEvent } from "@ledgerhq/types-live";
import { genericGetAccountShape } from "./getAccountShape";
import { getSigner } from "./signer";
import type { CoinFrameworkSigner } from "./types";
import { postSync } from "./postSync";
import { alpacaIsEmpty } from "./accountBridge";

const SIBLING_PROBE_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`probe timed out after ${ms}ms`)), ms);
    promise.then(
      v => {
        clearTimeout(id);
        resolve(v);
      },
      e => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

export function getCoinFrameworkCurrencyBridge(
  network: string,
  kind: string,
  customSigner?: CoinFrameworkSigner,
): CurrencyBridge {
  const signer = customSigner ?? getSigner(network);
  const isEmpty = (currency: CryptoCurrency, address: string) =>
    alpacaIsEmpty(kind, currency, address);

  const baseScanAccounts = makeScanAccounts({
    getAccountShape: genericGetAccountShape(network, kind),
    getAddressFn: signer.getAddress.bind(signer),
    postSync,
    isEmpty,
  });

  // EVM family: a derivation path produces the same address on every EVM chain
  // (all share coinType 60). After the primary scan emits the first account,
  // probe every other EVM at the same address — exactly once per sibling chain —
  // and emit discovered accounts for chains that have history.
  // Each probe is bounded by a 30s timeout so a hanging chain can't block scan completion.
  const scanAccounts: CurrencyBridge["scanAccounts"] =
    network === "evm"
      ? info =>
          new Observable<ScanAccountEvent>(observer => {
            const probedSiblings = new Set<string>(); // currency.id of siblings we've already probed
            const otherEvms = listCryptoCurrencies(true, true).filter(
              c => c.family === "evm" && c.id !== info.currency.id,
            );

            const sub = baseScanAccounts(info).subscribe({
              next: event => {
                observer.next(event);
                const { account } = event;

                // Probe siblings in parallel for the very first emitted account only.
                // Each sibling chain is probed at most once across the whole scan.
                otherEvms.forEach(otherCurrency => {
                  if (probedSiblings.has(otherCurrency.id)) return;
                  probedSiblings.add(otherCurrency.id);

                  withTimeout(isEmpty(otherCurrency, account.freshAddress), SIBLING_PROBE_TIMEOUT_MS)
                    .then(empty => {
                      if (empty || observer.closed) return;
                      observer.next({
                        type: "discovered",
                        account: buildCrossEvmAccount(account, otherCurrency),
                      });
                    })
                    .catch(() => {
                      /* swallow per-chain probing errors (incl. timeout) so one chain can't break the scan */
                    });
                });
              },
              error: e => observer.error(e),
              complete: () => observer.complete(),
            });

            return () => sub.unsubscribe();
          })
      : baseScanAccounts;

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => undefined,
    scanAccounts,
  };
}

/**
 * Re-shapes a discovered EVM account onto another EVM currency using the same address.
 * Balance/operations are left empty here — the consumer can sync them on demand.
 */
function buildCrossEvmAccount(source: Account, target: CryptoCurrency): Account {
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: target.id,
    xpubOrAddress: source.freshAddress,
    derivationMode: source.derivationMode,
  });
  return {
    ...source,
    id,
    currency: target,
    xpub: source.freshAddress,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    swapHistory: [],
    subAccounts: [],
    blockHeight: 0,
    balanceHistoryCache: emptyHistoryCache,
    lastSyncDate: new Date(),
  };
}
