import { useState, useEffect, useMemo, useRef } from "react";
import useMemoOnce from "../../hooks/useMemoOnce";
import { useBridgeSync } from "../../bridge/react";
import {
  getCurrentPolkadotPreloadData,
  getPolkadotPreloadDataUpdates,
} from "@ledgerhq/coin-polkadot/logic/state";
import type {
  PolkadotValidator,
  PolkadotNomination,
  PolkadotSearchFilter,
  PolkadotAccount,
} from "@ledgerhq/coin-polkadot/types/index";
const SYNC_REFRESH_RATE = 6000; // 6s - block time

export function usePolkadotPreloadData() {
  const [state, setState] = useState(getCurrentPolkadotPreloadData);
  useEffect(() => {
    const sub = getPolkadotPreloadDataUpdates().subscribe(data => {
      setState(data);
    });
    return () => sub.unsubscribe();
  }, []);
  return state;
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
