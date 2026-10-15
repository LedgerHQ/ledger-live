import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "LLD/hooks/redux";
import { createSelector } from "@reduxjs/toolkit";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { accountNameWithDefaultSelector } from "@domain/entity-account-name";
import type { Currency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountDataToolInput } from "@devtools/bindings";
import type { State } from "~/renderer/reducers";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { walletSelector } from "~/renderer/reducers/wallet";

// Recomputed only when either slice changes; joined so an equal set of assets is an equal string.
const assetIdsSelector = createSelector(
  [(state: State) => state.accountBalances, (state: State) => state.accountOperations],
  (balances, operations) => {
    const ids = new Set<string>();
    for (const rows of Object.values(balances)) for (const row of rows ?? []) ids.add(row.assetId);
    for (const entry of Object.values(operations)) {
      for (const operation of entry?.operations ?? []) ids.add(operation.assetId);
    }
    return [...ids].sort().join("\n");
  },
);

/** The accounts the account data tool lists, and the metadata of every asset a source answered. */
export function useAccountDataToolInputs(): {
  inputs: AccountDataToolInput[];
  currencyOf: (assetId: string) => Currency | undefined;
} {
  const accounts = useSelector(shallowAccountsSelector);
  const wallet = useSelector(walletSelector);
  const assetIds = useSelector(assetIdsSelector);
  const [fetched, setFetched] = useState<Partial<Record<string, Currency>>>({});
  const asked = useRef(new Set<string>());

  const inputs = useMemo(
    () =>
      accounts.flatMap(account => {
        try {
          const descriptor = fromLegacyAccount(account);
          return [
            { descriptor, name: accountNameWithDefaultSelector(wallet.accountNames, account) },
          ];
        } catch {
          // An account whose derivation is unknown has no descriptor: no source can be asked about it.
          return [];
        }
      }),
    [accounts, wallet.accountNames],
  );

  const known = useMemo(() => {
    const byId: Partial<Record<string, Currency>> = {};
    for (const account of accounts) {
      byId[account.currency.id] = account.currency;
      for (const token of account.subAccounts ?? []) byId[token.token.id] = token.token;
    }
    return byId;
  }, [accounts]);

  const currencyOf = useCallback(
    (assetId: string) => known[assetId] ?? fetched[assetId] ?? findCryptoCurrencyById(assetId),
    [known, fetched],
  );

  // A source may answer a token the legacy account does not hold yet: look it up once.
  useEffect(() => {
    const missing = assetIds
      .split("\n")
      .filter(
        assetId =>
          assetId !== "" && !asked.current.has(assetId) && currencyOf(assetId) === undefined,
      );
    if (missing.length === 0) return;
    for (const assetId of missing) asked.current.add(assetId);
    void Promise.allSettled(missing.map(id => getCryptoAssetsStore().findTokenById(id))).then(
      results => {
        const tokens = results.flatMap((result, index) => {
          // A lookup that failed may succeed later: let the next run ask again.
          if (result.status === "rejected") asked.current.delete(missing[index]);
          return result.status === "fulfilled" && result.value ? [result.value] : [];
        });
        const found = Object.fromEntries(tokens.map(token => [token.id, token]));
        if (Object.keys(found).length > 0) setFetched(previous => ({ ...previous, ...found }));
      },
    );
  }, [assetIds, currencyOf]);

  return { inputs, currencyOf };
}
