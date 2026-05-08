import { accountsABI, electionABI, lockedGoldABI } from "@celo/abis";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import { celoGasPrice, getCeloClient } from "./client";
import { getRegistryAddressFor } from "./registry";
import type { CeloVote } from "../types/types";

/**
 * Fetch account registered status. To lock any Celo, account needs to be registered first.
 */
export const getAccountRegistrationStatus = async (address: string): Promise<boolean> => {
  const client = getCeloClient();
  const accountsAddress = await getRegistryAddressFor("Accounts");
  return client.readContract({
    address: accountsAddress,
    abi: accountsABI,
    functionName: "isAccount",
    args: [address as `0x${string}`],
  });
};

/**
 * Fetch pending withdrawals, with an index.
 */
export const getPendingWithdrawals = async (address: string) => {
  const client = getCeloClient();
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
  const [values, timestamps] = await client.readContract({
    address: lockedGoldAddress,
    abi: lockedGoldABI,
    functionName: "getPendingWithdrawals",
    args: [address as `0x${string}`],
  });

  return [...values]
    .map((value, index) => ({
      value: new BigNumber(value.toString()),
      time: new BigNumber(timestamps[index].toString()),
      index,
    }))
    .sort((a, b) => a.time.minus(b.time).toNumber());
};

/**
 * Fetch all votes.
 *
 * The Celo Election contract does not expose a single aggregated `getVoter`
 * call (that helper only exists in the JS contractkit). We therefore mirror
 * its behaviour by listing the groups voted for and then querying pending /
 * active stakes group-by-group.
 */
export const getVotes = async (address: string): Promise<CeloVote[]> => {
  const client = getCeloClient();
  const electionAddress = await getRegistryAddressFor("Election");
  const signerAddress = (await voteSignerAccount(address)) as `0x${string}`;

  let groups: readonly `0x${string}`[];
  try {
    groups = await client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "getGroupsVotedForByAccount",
      args: [signerAddress],
    });
  } catch {
    return [];
  }

  const groupedVotes = await Promise.all(
    groups.map(async group => {
      const [pendingRaw, activeRaw] = await Promise.all([
        client.readContract({
          address: electionAddress,
          abi: electionABI,
          functionName: "getPendingVotesForGroupByAccount",
          args: [group, signerAddress],
        }),
        client.readContract({
          address: electionAddress,
          abi: electionABI,
          functionName: "getActiveVotesForGroupByAccount",
          args: [group, signerAddress],
        }),
      ]);

      const pending = new BigNumber(pendingRaw.toString());
      const active = new BigNumber(activeRaw.toString());
      const groupVotes: CeloVote[] = [];

      const activatable = pending.gt(0)
        ? await client.readContract({
            address: electionAddress,
            abi: electionABI,
            functionName: "hasActivatablePendingVotes",
            args: [signerAddress, group],
          })
        : false;

      let activeVoteRevokable = true;

      if (pending.gt(0)) {
        activeVoteRevokable = false;
        groupVotes.push({
          validatorGroup: group,
          amount: pending,
          activatable,
          revokable: true,
          index: 0,
          type: "pending",
        });
      }

      if (active.gt(0)) {
        groupVotes.push({
          validatorGroup: group,
          amount: active,
          activatable: false,
          revokable: activeVoteRevokable,
          index: 1,
          type: "active",
        });
      }

      return groupVotes;
    }),
  );

  return groupedVotes.flat();
};

/**
 * Fetch and cache the vote signer account for an address.
 * Cache is held for 1 hour since vote signer is usually the same account.
 */
export const voteSignerAccount = makeLRUCache(
  async (address: string): Promise<string> => {
    const client = getCeloClient();
    const accountsAddress = await getRegistryAddressFor("Accounts");
    return client.readContract({
      address: accountsAddress,
      abi: accountsABI,
      functionName: "voteSignerToAccount",
      args: [address as `0x${string}`],
    });
  },
  address => address,
  {
    ttl: 60 * 60 * 1000, // 1 hour
  },
);

/**
 * Compute fee market gas parameters (mirrors @celo/connect `setFeeMarketGas`).
 * Returns maxFeePerGas and maxPriorityFeePerGas as bigint.
 */
export const getFeeMarketGasParams = async (
  feeCurrency?: `0x${string}`,
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> => {
  const client = getCeloClient();
  const [gasPrice, maxPriorityFeePerGas] = await Promise.all([
    celoGasPrice(feeCurrency),
    client.estimateMaxPriorityFeePerGas(),
  ]);

  const baseFeePerGas =
    gasPrice > maxPriorityFeePerGas ? gasPrice - maxPriorityFeePerGas : BigInt(0);
  const maxFeePerGas = (baseFeePerGas * BigInt(120)) / BigInt(100) + maxPriorityFeePerGas;

  return { maxFeePerGas, maxPriorityFeePerGas };
};
