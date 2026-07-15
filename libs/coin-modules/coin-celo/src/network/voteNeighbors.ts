import { electionABI } from "@celo/abis";
import { ZERO_ADDRESS } from "../constants";
import { getCeloClient } from "./client";
import { isRevertLike } from "./rpcErrors";

const ZERO = ZERO_ADDRESS as `0x${string}`;

const computeUpdatedVotes = (currentVotes: bigint, delta: bigint, add: boolean): bigint => {
  if (add) return currentVotes + delta;
  if (currentVotes > delta) return currentVotes - delta;
  return 0n;
};

const compareVotesAscending = (a: { votes: bigint }, b: { votes: bigint }): number => {
  if (a.votes < b.votes) return -1;
  if (a.votes > b.votes) return 1;
  return 0;
};

/**
 * Find the lesser/greater neighbor groups for a Celo Election `vote`/`revoke`.
 *
 * The Election contract keeps eligible validator groups in a doubly-linked list
 * sorted by total votes; `vote`/`revoke*` must be told which groups sit just
 * below (`lesser`) and above (`greater`) the target once its vote total changes,
 * or the call reverts. This recomputes those neighbors off the on-chain totals.
 *
 * Single source of truth shared by the api staking builder
 * (`src/api/buildStakingTxParams.ts`) and the legacy bridge
 * (`src/bridge/buildTransaction.ts`).
 */
export const getVoteNeighbors = async (
  electionAddress: `0x${string}`,
  group: `0x${string}`,
  delta: bigint,
  add: boolean,
): Promise<{ lesser: `0x${string}`; greater: `0x${string}` }> => {
  const client = getCeloClient();

  // On networks where no validator groups are registered (e.g. some testnets)
  // the call reverts. Treat only a revert as an empty list (defaults → ZERO
  // neighbors); a transient/transport failure must surface, otherwise it would
  // silently yield ZERO neighbors and make the subsequent vote/revoke revert.
  let groups: readonly `0x${string}`[] = [];
  let votes: readonly bigint[] = [];
  try {
    [groups, votes] = await client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "getTotalVotesForEligibleValidatorGroups",
    });
  } catch (error) {
    if (!isRevertLike(error)) throw error;
  }

  const groupIdx = groups.findIndex(g => g.toLowerCase() === group.toLowerCase());
  const currentVotes = groupIdx >= 0 ? votes[groupIdx] : 0n;
  const newVotes = computeUpdatedVotes(currentVotes, delta, add);

  // Always include the target group in the sorted list. When groupIdx === -1 the
  // group is not yet in the eligible set (first-time voter), so we insert it
  // explicitly — otherwise it is missing from `sorted`, idx stays -1, and
  // lesser/greater are wrong, causing the Election contract to revert.
  const normalizedGroup = group.toLowerCase();
  const otherGroups: { address: `0x${string}`; votes: bigint }[] = groups.reduce(
    (acc, addr, index) => {
      if (addr.toLowerCase() !== normalizedGroup) {
        acc.push({ address: addr, votes: votes[index] });
      }
      return acc;
    },
    [] as { address: `0x${string}`; votes: bigint }[],
  );

  const sorted: { address: `0x${string}`; votes: bigint }[] = [
    ...otherGroups,
    { address: group, votes: newVotes },
  ].sort(compareVotesAscending);

  const idx = sorted.findIndex(g => g.address.toLowerCase() === group.toLowerCase());

  const lesser = idx > 0 ? sorted[idx - 1].address : ZERO;
  const greater = idx < sorted.length - 1 ? sorted[idx + 1].address : ZERO;

  return { lesser, greater };
};
