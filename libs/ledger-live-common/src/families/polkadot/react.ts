import { useState, useEffect, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type {
  PolkadotValidator,
  PolkadotStakingProgress,
  PolkadotNomination,
  PolkadotSearchFilter,
  PolkadotAccount,
  PolkadotPreloadData,
} from "@ledgerhq/coin-polkadot";
import polkadotAPI from "@ledgerhq/coin-polkadot/network";
import coinConfig from "@ledgerhq/coin-polkadot/config";
import useMemoOnce from "../../hooks/useMemoOnce";
import { useBridgeSync } from "../../bridge/react";

const SYNC_REFRESH_RATE = 6000; // 6s - block time

// Render seeds (keyed by currency id) so a remount paints last-known data
// instantly while the network-cache-backed fetch resolves. Not authoritative:
// the LRU caches in @ledgerhq/coin-polkadot/network are the source of truth.
const lastSeenValidators: Record<string, PolkadotValidator[]> = {};
const lastSeenStaking: Record<string, PolkadotStakingProgress | undefined> = {};
const lastSeenMinBond: Record<string, BigNumber> = {};

function usePolkadotData<T>(
  currency: CryptoCurrency | undefined,
  seeds: Record<string, T>,
  fallback: T,
  fetcher: (currency: CryptoCurrency) => Promise<T>,
): T {
  const currencyId = (currency ?? getCryptoCurrencyById("polkadot")).id;
  const [data, setData] = useState<T>(() => seeds[currencyId] ?? fallback);

  useEffect(() => {
    let unsub = false;
    const cur = currency ?? getCryptoCurrencyById("polkadot");
    // Reset to this currency's seed (or fallback) so a currency switch on a
    // reused component instance never shows the previous currency's data.
    setData(seeds[cur.id] ?? fallback);
    // Promise.resolve().then keeps a synchronous throw from fetcher (e.g.
    // getCoinConfig when no config is registered) inside the promise chain so
    // it is handled by the catch below instead of escaping the effect.
    Promise.resolve()
      .then(() => fetcher(cur))
      .then(value => {
        if (unsub) return;
        // On failure we keep the current value rather than clobber it (offline).
        seeds[cur.id] = value;
        setData(value);
      })
      .catch(() => {});
    return () => {
      unsub = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyId]);

  return data;
}

/** Fetch the Polkadot validators list on demand (LRU-cached in the network layer). */
export function usePolkadotValidators(currency?: CryptoCurrency): PolkadotValidator[] {
  return usePolkadotData(currency, lastSeenValidators, [], cur =>
    polkadotAPI.getValidators("all", cur),
  );
}

/** Fetch the Polkadot staking progress (election status, era…) on demand. */
export function usePolkadotStakingProgress(
  currency?: CryptoCurrency,
): PolkadotStakingProgress | undefined {
  return usePolkadotData(currency, lastSeenStaking, undefined, cur =>
    polkadotAPI.getStakingProgress(coinConfig.getCoinConfig(cur.id), cur),
  );
}

/** Fetch the Polkadot minimum bond balance on demand. */
export function usePolkadotMinimumBondBalance(currency?: CryptoCurrency): BigNumber {
  return usePolkadotData(currency, lastSeenMinBond, new BigNumber(0), cur =>
    polkadotAPI.getMinimumBondBalance(coinConfig.getCoinConfig(cur.id), cur),
  );
}

/**
 * Composite of the granular hooks above — use only when a screen genuinely
 * needs all three; otherwise prefer the granular hook to avoid over-fetching
 * (e.g. the account footer only needs the minimum bond balance).
 * Replaces the deprecated CurrencyBridge.preload/hydrate mechanism.
 */
export function usePolkadotPreloadData(currency?: CryptoCurrency): PolkadotPreloadData {
  const validators = usePolkadotValidators(currency);
  const staking = usePolkadotStakingProgress(currency);
  const minimumBondBalance = usePolkadotMinimumBondBalance(currency);
  return useMemo(
    () => ({ validators, staking, minimumBondBalance: minimumBondBalance.toString() }),
    [validators, staking, minimumBondBalance],
  );
}
export const searchFilter: PolkadotSearchFilter = query => validator => {
  const terms = `${validator?.identity ?? ""} ${validator?.address ?? ""}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedValidators(
  search: string,
  validators: PolkadotValidator[],
  nominations: PolkadotNomination[],
  validatorSearchFilter: PolkadotSearchFilter = searchFilter,
): PolkadotValidator[] {
  const initialVotes = useMemoOnce(() => nominations.map(({ address }) => address));
  const sortedVotes = useMemo(
    () =>
      validators
        .filter(validator => initialVotes.includes(validator.address))
        .concat(validators.filter(validator => !initialVotes.includes(validator.address))),
    [validators, initialVotes],
  );
  const sr = useMemo(
    () => (search ? validators.filter(validatorSearchFilter(search)) : sortedVotes),
    [search, validators, sortedVotes, validatorSearchFilter],
  );
  return sr;
}

/**
 * Sync account until "controller" is set - following a first bond.
 *
 * @param {*} account
 */
export function usePolkadotBondLoading(account: PolkadotAccount) {
  const controller = account.polkadotResources?.controller || null;
  const initialAccount = useRef(account);
  const [isLoading, setLoading] = useState(!controller);
  useEffect(() => {
    if (controller) {
      setLoading(false);
    }
  }, [controller]);
  const sync = useBridgeSync();
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      sync({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: initialAccount.current.id,
        reason: "polkadot-bond-loading",
      });
    }, SYNC_REFRESH_RATE);
    return () => clearInterval(interval);
  }, [initialAccount, sync, isLoading]);
  return isLoading;
}
