import { Observable, defer, from } from "rxjs";
import { filter, map, mergeMap, skip, take } from "rxjs/operators";
import type { Account, SyncConfig } from "@ledgerhq/types-live";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { findCryptoCurrencyByKeyword } from "../../currencies/index";
import { getCurrencyBridge } from "../../bridge/index";
import { makeBridgeCacheSystem } from "../../bridge/cache";

export type ScanOpts = {
  currency: string;
  device?: string;
  scheme?: string;
  index?: number;
  length?: number;
};

const localCache: Record<string, unknown> = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

export function scan({ currency, device, scheme, index, length }: ScanOpts): Observable<Account> {
  const cur = findCryptoCurrencyByKeyword(currency);
  if (!cur) throw new Error(`Unknown currency: ${currency}`);

  const syncConfig: SyncConfig = { paginationConfig: {} };

  return defer(() => from(cache.prepareCurrency(cur).then(() => getCurrencyBridge(cur)))).pipe(
    mergeMap(bridge =>
      bridge.scanAccounts({
        currency: cur,
        deviceId: device || "",
        scheme: scheme !== undefined ? asDerivationMode(scheme) : undefined,
        syncConfig,
      }),
    ),
    filter(e => e.type === "discovered"),
    map(e => e.account),
    skip(index || 0),
    take(length === undefined ? (index !== undefined ? 1 : Infinity) : length),
  );
}
