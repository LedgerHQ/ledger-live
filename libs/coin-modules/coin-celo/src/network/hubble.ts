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

  // Batch all capacity reads in one Multicall3 round-trip. A group can receive votes when its
  // cap (getNumVotesReceivable) is above its current total votes; saturated groups are excluded.
  type CapacityResult = { status: "success"; result: unknown } | { status: "failure" };
  const capacityResults: readonly CapacityResult[] = await client
    .multicall({
      allowFailure: true,
      contracts: rawGroups.flatMap((vg: { address: `0x${string}` }) => [
        {
          address: electionAddress,
          abi: electionABI,
          functionName: "getNumVotesReceivable",
          args: [vg.address],
        },
        {
          address: electionAddress,
          abi: electionABI,
          functionName: "getTotalVotesForGroup",
          args: [vg.address],
        },
      ]),
    })
    .catch(() => []);

  const canReceiveVotes = rawGroups.map((vg: { address: `0x${string}` }, index: number) => {
    if (!eligibleSet.has(vg.address.toLowerCase())) return false;
    const voteCap = capacityResults[index * 2];
    const totalVotes = capacityResults[index * 2 + 1];
    if (voteCap?.status !== "success" || totalVotes?.status !== "success") return true;
    return (voteCap.result as bigint) > (totalVotes.result as bigint);
  });

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

const customValidatorGroupsOrder = (validatorGroups: CeloValidatorGroup[]): CeloValidatorGroup[] =>
  [...validatorGroups]
    .filter(group => !isDefaultValidatorGroup(group)) // Excludes the deprecated "Ledger by Figment"
    .sort((a, b) => b.votes.comparedTo(a.votes));
