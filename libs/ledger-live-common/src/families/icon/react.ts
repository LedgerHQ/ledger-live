import invariant from "invariant";
import { useState, useEffect, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import type { PRep, IconAccount, Vote } from "./types";
import { useBridgeSync } from "../../bridge/react";
import { getPreps } from "./api/sdk";

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
  initialVotes: Record<string, BigNumber>; // initial Map of votes
};

export const SR_THRESHOLD = 22;
export let SR_MAX_VOTES = 0;
export const MIN_TRANSACTION_AMOUNT = 1;

let __lastSeenPR: PRep[] = [];

/** Fetch the list of super representatives */
export const useIconPublicRepresentatives = (currency): Array<PRep> => {
  const [pr, setPr] = useState(__lastSeenPR);
  useEffect(() => {
    let unsub = false;
    getPreps(currency).then((pr: PRep[]) => {
      __lastSeenPR = pr;
      if (unsub) return;
      setPr(pr);
    });
    return () => {
      unsub = true;
    };
  }, []);
  SR_MAX_VOTES = pr.length;
  return pr;
};



/** format votes with publicRepresentatives data */
export const formatVotes = (
  votes: Array<Vote> | null | undefined,
  publicRepresentatives: Array<PRep> | null | undefined
): Array<
  Vote & {
    validator?: PRep;
    isPR: boolean;
    rank: number;
  }
> => {
  return votes && publicRepresentatives
    ? votes.map(({ address, value }) => {
      const prIndex = publicRepresentatives.findIndex(
        (sp) => sp.address === address
      );
      return {
        validator: publicRepresentatives[prIndex],
        rank: prIndex + 1,
        isPR: prIndex < SR_THRESHOLD,
        address,
        value,
      };
    })
    : [];
};

// wait an effect of a tron freeze until it effectively change
export function useVotingPowerLoading(account: IconAccount): boolean {
  const votingPower =
    (account.iconResources && account.iconResources.votingPower) || 0;
  const initialVotingPower = useRef(votingPower);
  const initialAccount = useRef(account);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (initialVotingPower.current !== votingPower) {
      setLoading(false);
    }
  }, [votingPower]);

  const sync = useBridgeSync();

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      sync({
        type: "SYNC_ONE_ACCOUNT",
        priority: 10,
        accountId: initialAccount.current.id,
        reason: "icon-power-load",
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [initialAccount, sync, isLoading]);

  return isLoading;
}

/** Search filters for SR list */
const searchFilter =
  (query?: string) =>
    ({ name, address }: { name: string | null | undefined; address: string; }) => {
      if (!query) return true;
      const terms = `${name || ""} ${address}`;
      return terms.toLowerCase().includes(query.toLowerCase().trim());
    };

/** Hook to search and sort SR list according to initial votes and query */
export function useSortedSr(
  search: string,
  publicRepresentatives: PRep[],
  votes: Vote[]
): {
  pr: PRep;
  name: string | null | undefined;
  address: string;
  rank: number;
  isSR: boolean;
}[] {
  const { current: initialVotes } = useRef(votes.map(({ address }) => address));
  const PR = useMemo(
    () =>
      publicRepresentatives.map((pr, rank) => ({
        pr,
        name: pr.name,
        address: pr.address,
        rank: rank + 1,
        isSR: rank < SR_THRESHOLD,
      })),
    [publicRepresentatives]
  );
  const sortedVotes = useMemo(
    () =>
      PR.filter(({ address }) => initialVotes.includes(address)).concat(
        PR.filter(({ address }) => !initialVotes.includes(address))
      ),
    [PR, initialVotes]
  );
  const pr = useMemo(
    () => (search ? PR.filter(searchFilter(search)) : sortedVotes),
    [search, PR, sortedVotes]
  );
  return pr;
}

