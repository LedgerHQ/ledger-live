import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import { ONE_TRX } from "@ledgerhq/coin-tron/logic/constants";
import { accountNamesCache, getTronSuperRepresentatives } from "@ledgerhq/coin-tron/network";
import type { SuperRepresentative, TronAccount, Vote } from "@ledgerhq/coin-tron/types/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBridgeSync } from "../../bridge/react";
import { getCurrencyConfiguration } from "../../config";

export type Action = {
  type: "updateVote" | "resetVotes" | "clearVotes";
  address: string;
  value: string;
};

export type State = {
  votes: Record<string, number>;
  // formatted Map of votes
  votesAvailable: number;
  // total of available TP
  votesUsed: number;
  // total of TP used
  votesSelected: number;
  // number of SR votes selected
  max: number;
  // votes remaining
  initialVotes: Record<string, number>; // initial Map of votes
};

export const MIN_TRANSACTION_AMOUNT = ONE_TRX;
export const SR_THRESHOLD = 27;
export const SR_MAX_VOTES = 5;

let __lastSeenSR: SuperRepresentative[] = [];

/** Fetch the list of super representatives */
export const useTronSuperRepresentatives = (): Array<SuperRepresentative> => {
  const [sr, setSr] = useState(__lastSeenSR);
  useEffect(() => {
    let unsub = false;
    const config = getCurrencyConfiguration<TronCoinConfig>("tron");
    getTronSuperRepresentatives(config).then((sr: SuperRepresentative[]) => {
      __lastSeenSR = sr;
      if (unsub) return;
      setSr(sr);
    });
    return () => {
      unsub = true;
    };
  }, []);
  return sr;
};

/**
 * Get last time voted.
 *
 * `tronResources.lastVotedDate` is only populated when the account shape is built from the
 * transaction list; the generic coin framework's `buildAccountShape` hook receives an address alone,
 * so it is absent there. The latest VOTE operation is the same fact from the data the account already
 * carries, which keeps the value available on both paths without a second network call. Taken as a
 * max rather than the first match, so it does not silently depend on the operation order.
 */
export const getLastVotedDate = (account: TronAccount): Date | null | undefined => {
  if (account.tronResources?.lastVotedDate) return account.tronResources.lastVotedDate;
  const voteDates = (account.operations ?? [])
    .filter(operation => operation.type === "VOTE")
    .map(operation => operation.date.getTime());
  return voteDates.length > 0 ? new Date(Math.max(...voteDates)) : null;
};

/** Get next available date to claim rewards */
export const getNextRewardDate = (account: TronAccount): number | null | undefined => {
  const lastWithdrawnRewardDate =
    account.tronResources && account.tronResources.lastWithdrawnRewardDate
      ? account.tronResources.lastWithdrawnRewardDate
      : null;

  if (lastWithdrawnRewardDate) {
    // add 24hours
    const nextDate = lastWithdrawnRewardDate.getTime() + 24 * 60 * 60 * 1000;
    if (nextDate > Date.now()) return nextDate;
  }

  return null;
};

/**
 * Fill in the super-representative names a vote list is missing.
 *
 * Votes read off a synced account already carry one (`logic/tronResources.ts` resolves it), but a
 * vote the user has just submitted does not: it reaches the wallet through the wallet API, which
 * carries only address and count, and the optimistic operation is described synchronously. Nothing
 * cheaper is available — `getTronSuperRepresentatives` returns no names, so this is a lookup per
 * address, behind the same 3-hour cache the sync path fills.
 *
 * Votes that already have a name are returned untouched, so a synced operation costs no request.
 */
export const useVoteNames = (
  votes: Array<Vote> | null | undefined,
): Array<Vote> | null | undefined => {
  const [names, setNames] = useState<Record<string, string | null | undefined>>({});
  // Joined into a string so the effect keys on the addresses themselves: `votes` is a fresh array on
  // every render, and the operation-details screen re-renders on each sync.
  const missing = (votes ?? []).filter(vote => !vote.name).map(vote => vote.address);
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    let unsub = false;
    const config = getCurrencyConfiguration<TronCoinConfig>("tron");
    // No `.catch`: a rejected lookup (TronGrid unreachable) is left to surface rather than swallowed,
    // matching `useTronSuperRepresentatives` above — the row simply keeps rendering the raw address.
    // The effect keys on `missingKey`, so a failed lookup is retried only when the set of unnamed vote
    // addresses changes, not on every render.
    Promise.all(
      missingKey
        .split(",")
        .map(async address => [address, await accountNamesCache(config, address)]),
    ).then(entries => {
      if (unsub) return;
      setNames(previous => ({ ...previous, ...Object.fromEntries(entries) }));
    });
    return () => {
      unsub = true;
    };
  }, [missingKey]);

  // Memoised on the inputs the result actually depends on: without it the `.map` rebuilds the array
  // every render once a name has resolved, re-running `formatVotes` in the consumers. A list that
  // gained no name is still returned by reference, so the all-nameless case stays free.
  return useMemo(() => {
    if (!votes || !missingKey) return votes;
    const resolved = votes.map(vote => {
      const name = vote.name ? undefined : names[vote.address];
      // An address the chain has no name for stays untouched rather than being rewritten to
      // `undefined` — the row renders the same either way, and this keeps the object identity.
      return name === undefined ? vote : { ...vote, name };
    });
    return resolved.some((vote, index) => vote !== votes[index]) ? resolved : votes;
  }, [votes, missingKey, names]);
};

/** format votes with superrepresentatives data */
export const formatVotes = (
  votes: Array<Vote> | null | undefined,
  superRepresentatives: Array<SuperRepresentative> | null | undefined,
): Array<
  Vote & {
    isSR: boolean;
  }
> => {
  return votes && superRepresentatives
    ? votes.map(({ name, address, voteCount }) => {
        const srIndex = superRepresentatives.findIndex(sp => sp.address === address);
        return {
          name,
          isSR: srIndex < SR_THRESHOLD,
          address,
          voteCount,
        };
      })
    : [];
};

// wait an effect of a tron freeze until it effectively change
export function useTronPowerLoading(account: TronAccount): boolean {
  const tronPower = (account.tronResources && account.tronResources.tronPower) || 0;
  const initialTronPower = useRef(tronPower);
  const initialAccount = useRef(account);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialTronPower.current !== tronPower) {
      setLoading(false);
    }
  }, [tronPower]);

  const sync = useBridgeSync();

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      sync({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: initialAccount.current.id,
        reason: "tron-power-load",
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [initialAccount, sync, isLoading]);

  return isLoading;
}

/** format account to retrieve unfreeze data */
export const getUnfreezeData = (
  account: TronAccount,
): {
  unfreezeBandwidth: BigNumber;
  unfreezeEnergy: BigNumber;
  canUnfreezeBandwidth: boolean;
  canUnfreezeEnergy: boolean;
} => {
  const { tronResources } = account;
  invariant(tronResources, "getUnfreezeData: tron account is expected");

  const frozen = tronResources?.frozen ?? { bandwidth: null, energy: null };
  const bandwidth = frozen.bandwidth;
  const energy = frozen.energy;

  const unfreezeBandwidth = new BigNumber(bandwidth ? bandwidth.amount : 0);

  const canUnfreezeBandwidth = unfreezeBandwidth.gt(0);

  const unfreezeEnergy = new BigNumber(energy ? energy.amount : 0);

  const canUnfreezeEnergy = unfreezeEnergy.gt(0);

  return {
    unfreezeBandwidth,
    unfreezeEnergy,
    canUnfreezeBandwidth,
    canUnfreezeEnergy,
  };
};
