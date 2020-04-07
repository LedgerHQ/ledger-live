// @flow
import { useState, useEffect, useMemo, useReducer, useRef } from "react";
import { getTronSuperRepresentatives, getNextVotingDate } from "../../api/Tron";

import { BigNumber } from "bignumber.js";
import type { SuperRepresentative, Vote, TronResources } from "./types";
import type { Account } from "../../types";
import { useBridgeSync } from "../../bridge/react";
import { getCryptoCurrencyById } from "../../currencies";

export type Action = {
  type: "updateVote" | "resetVotes" | "clearVotes",
  address: string,
  value: string
};

export type State = {
  votes: { [address: string]: number }, // formatted Map of votes
  votesAvailable: number, // total of available TP
  votesUsed: number, // total of TP used
  votesSelected: number, // number of SR votes selected
  max: number, // votes remaining
  initialVotes: { [address: string]: number } // initial Map of votes
};

const oneTrx = BigNumber(10).pow(
  getCryptoCurrencyById("tron").units[0].magnitude
);
export const MIN_TRANSACTION_AMOUNT = oneTrx;

export const SR_THRESHOLD = 27;
export const SR_MAX_VOTES = 5;

let __lastSeenSR: SuperRepresentative[] = [];

/** Fetch the list of super representatives */
export const useTronSuperRepresentatives = (): Array<SuperRepresentative> => {
  const [sr, setSr] = useState(__lastSeenSR);

  useEffect(() => {
    let unsub = false;
    getTronSuperRepresentatives().then((sr: SuperRepresentative[]) => {
      __lastSeenSR = sr;
      if (!unsub) return;
      setSr(sr);
    });
    return () => {
      unsub = true;
    };
  }, []);

  return sr;
};

/** Get next voting date window */
export const useNextVotingDate = (): ?number => {
  console.warn("DEPRECATED: useNextVotingDate");
  const [nextVotingDate, setNextVotingDate] = useState();
  useEffect(() => {
    getNextVotingDate().then(d => d && setNextVotingDate(d.valueOf()));
  }, []);

  return nextVotingDate;
};

/** Get last time voted */
export const getLastVotedDate = (account: Account): ?Date => {
  return account.tronResources && account.tronResources.lastVotedDate
    ? account.tronResources.lastVotedDate
    : null;
};

/** Get next available date to claim rewards */
export const getNextRewardDate = (account: Account): ?number => {
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

/** format votes with superrepresentatives data */
export const formatVotes = (
  votes: ?Array<Vote>,
  superRepresentatives: ?Array<SuperRepresentative>
): Array<{|
  ...Vote,
  validator: ?SuperRepresentative,
  isSR: boolean,
  rank: number
|}> => {
  return votes && superRepresentatives
    ? votes.map(({ address, voteCount }) => {
        const srIndex = superRepresentatives.findIndex(
          sp => sp.address === address
        );

        return {
          validator: superRepresentatives[srIndex],
          rank: srIndex + 1,
          isSR: srIndex < SR_THRESHOLD,
          address,
          voteCount
        };
      })
    : [];
};

// wait an effect of a tron freeze until it effectively change
export function useTronPowerLoading(account: Account) {
  const tronPower =
    (account.tronResources && account.tronResources.tronPower) || 0;
  const initialTronPower = useRef(tronPower);
  const initialAccount = useRef(account);

  const [isLoading, setLoading] = useState(true);

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
        accountId: initialAccount.current.id
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [initialAccount, sync, isLoading]);

  return isLoading;
}

/** Search filters for SR list */
const searchFilter = (query?: string) => ({
  name,
  address
}: {
  name: ?string,
  address: string
}) => {
  if (!query) return true;
  const terms = `${name || ""} ${address}`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedSr(
  search: string,
  superRepresentatives: SuperRepresentative[],
  votes: Vote[]
): {
  sr: SuperRepresentative,
  name: ?string,
  address: string,
  rank: number,
  isSR: boolean
}[] {
  const { current: initialVotes } = useRef(votes.map(({ address }) => address));

  const SR = useMemo(
    () =>
      superRepresentatives.map((sr, rank) => ({
        sr,
        name: sr.name,
        address: sr.address,
        rank: rank + 1,
        isSR: rank < SR_THRESHOLD
      })),
    [superRepresentatives]
  );

  const sortedVotes = useMemo(
    () =>
      SR.filter(({ address }) => initialVotes.includes(address)).concat(
        SR.filter(({ address }) => !initialVotes.includes(address))
      ),
    [SR, initialVotes]
  );

  const sr = useMemo(
    () => (search ? SR.filter(searchFilter(search)) : sortedVotes),
    [search, SR, sortedVotes]
  );

  return sr;
}

/** Tron vote flow state reducer */
function votesReducer(state: State, { type, address, value }: Action) {
  console.warn("DEPRECATED: votesReducer");

  switch (type) {
    case "updateVote": {
      const voteCount = value
        ? parseInt(Number(value.replace(/[^0-9]/g, "")))
        : 0;
      const currentVotes = Object.values({
        ...state.votes,
        [address]: voteCount
      }).filter(Boolean);

      const votes = {
        ...state.votes,
        [address]:
          voteCount <= 0 || currentVotes.length > SR_MAX_VOTES ? 0 : voteCount
      };

      const votesUsed = Object.values(votes).reduce(
        (sum, count) => sum + Number(count),
        0
      );

      return {
        ...state,
        votes,
        votesUsed,
        votesSelected: Object.values(votes).filter(Boolean).length,
        max: Math.max(0, state.votesAvailable - votesUsed)
      };
    }
    case "resetVotes": {
      const { initialVotes, votesAvailable } = state;
      const votesUsed = Object.values(initialVotes).reduce(
        (sum, voteCount) => sum + Number(voteCount),
        0
      );
      return {
        ...state,
        votes: initialVotes,
        votesUsed,
        votesSelected: Object.keys(initialVotes).length,
        max: Math.max(0, votesAvailable - votesUsed)
      };
    }
    case "clearVotes": {
      return {
        ...state,
        votes: {},
        votesUsed: 0,
        votesSelected: 0,
        max: state.votesAvailable
      };
    }
    default:
      return state;
  }
}

/** Vote flow init state */
function initState(initialVotes, tronResources): State {
  console.warn("DEPRECATED: initState");

  const votes = initialVotes.reduce(
    (sum, { voteCount, address }) => ({ ...sum, [address]: voteCount }),
    {}
  );
  const votesAvailable = tronResources ? tronResources.tronPower : 0;
  const votesUsed = Object.values(votes).reduce(
    (sum, voteCount) => sum + Number(voteCount),
    0
  );

  return {
    votes,
    votesAvailable,
    votesUsed,
    votesSelected: initialVotes.length,
    max: Math.max(0, votesAvailable - votesUsed),
    initialVotes: votes
  };
}

export function toTransactionVotes(votes: {
  [address: string]: number
}): Vote[] {
  console.warn("DEPRECATED: toTransactionVotes");
  return Object.keys(votes)
    .map(address => ({ address, voteCount: votes[address] }))
    .filter(({ voteCount }) => voteCount > 0);
}

/** Hook to retrieve and update voting flow state */
export function useVotesReducer(
  initialVotes: Vote[],
  tronResources: ?TronResources
): [State, (action: Action) => void] {
  console.warn("DEPRECATED: useVotesReducer");

  const [state, dispatch]: [State, (action: Action) => void] = useReducer(
    votesReducer,
    initState(initialVotes, tronResources)
  );

  return [state, dispatch];
}
