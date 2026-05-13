import { electionABI } from "@celo/abis";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import { isDefaultValidatorGroup } from "../logic";
import { CeloValidatorGroup } from "../types/types";
import { getCeloClient } from "./client";
import { getRegistryAddressFor } from "./registry";

const getUrl = (route: string): string => `${getEnv("API_CELO_INDEXER")}${route || ""}`;

const fetchValidatorGroups = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/validator_groups`),
  });
  return data.items;
};

export const getValidatorGroups = async (): Promise<CeloValidatorGroup[]> => {
  const client = getCeloClient();
  const electionAddress = await getRegistryAddressFor("Election");

  const [rawGroups, eligibleGroups] = await Promise.all([
    fetchValidatorGroups(),
    client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "getEligibleValidatorGroups",
    }),
  ]);

  const eligibleSet = new Set(eligibleGroups.map(a => a.toLowerCase()));

  // Check on-chain capacity for every group in parallel.
  // A group must be in the eligible set and have remaining vote capacity (getNumVotesReceivable > 0),
  // which matches the semantics of ContractKit's getValidatorGroupVotes { eligible, capacity }.
  const canReceiveVotes = await Promise.all(
    rawGroups.map(async (vg: { address: `0x${string}` }) => {
      try {
        if (!eligibleSet.has(vg.address.toLowerCase())) return false;
        const capacity = await client.readContract({
          address: electionAddress,
          abi: electionABI,
          functionName: "getNumVotesReceivable",
          args: [vg.address],
        });
        return capacity > BigInt(0);
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
