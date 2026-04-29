import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import { isDefaultValidatorGroup } from "../logic";
import { celoKit } from "./sdk";
import { CeloValidatorGroup } from "../types/types";

const getUrl = (route: string): string => `${getEnv("API_CELO_INDEXER")}${route || ""}`;

const fetchValidatorGroups = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/validator_groups`),
  });
  return data.items;
};

export const getValidatorGroups = async (): Promise<CeloValidatorGroup[]> => {
  const [rawGroups, election] = await Promise.all([
    fetchValidatorGroups(),
    celoKit().contracts.getElection(),
  ]);

  // Check on-chain capacity for every group in parallel.
  // getValidatorGroupVotes returns the exact capacity (numVotesReceivable - currentVotes)
  // computed by the contract, which is more accurate than estimating from members_count.
  const canReceiveVotes = await Promise.all(
    rawGroups.map(async (vg: { address: string }) => {
      try {
        const { eligible, capacity } = await election.getValidatorGroupVotes(vg.address);
        return eligible && capacity.gt(0);
      } catch {
        return true;
      }
    }),
  );

  const result = rawGroups
    .filter((_: unknown, idx: number) => canReceiveVotes[idx])
    .map(
      (validatorGroup: {
        address: string;
        name: string;
        active_votes: BigNumber.Value;
        pending_votes: BigNumber.Value;
      }) => ({
        address: validatorGroup.address,
        name: validatorGroup.name || validatorGroup.address,
        votes: new BigNumber(validatorGroup.active_votes).plus(
          new BigNumber(validatorGroup.pending_votes),
        ),
      }),
    );

  return customValidatorGroupsOrder(result);
};

const customValidatorGroupsOrder = (
  validatorGroups: CeloValidatorGroup[],
): CeloValidatorGroup[] => {
  const defaultValidatorGroup = validatorGroups.find(isDefaultValidatorGroup);

  const sortedValidatorGroups = [...validatorGroups]
    .sort((a, b) => b.votes.comparedTo(a.votes))
    .filter(group => !isDefaultValidatorGroup(group));

  return defaultValidatorGroup
    ? [defaultValidatorGroup, ...sortedValidatorGroups]
    : sortedValidatorGroups;
};
