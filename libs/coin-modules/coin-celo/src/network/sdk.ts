import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import { ACCOUNTS_ABI, ELECTION_ABI, LOCKED_GOLD_ABI } from "./abis";
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
    abi: ACCOUNTS_ABI,
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
    abi: LOCKED_GOLD_ABI,
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
 */
export const getVotes = async (address: string): Promise<CeloVote[]> => {
  const client = getCeloClient();
  const electionAddress = await getRegistryAddressFor("Election");
  const signerAddress = await voteSignerAccount(address);

  let voterGroups: readonly { group: `0x${string}`; pending: bigint; active: bigint }[];
  try {
    voterGroups = await client.readContract({
      address: electionAddress,
      abi: ELECTION_ABI,
      functionName: "getVoter",
      args: [signerAddress as `0x${string}`],
    });
  } catch {
    return [];
  }

  const votes: CeloVote[] = [];

  await Promise.all(
    voterGroups.map(async vote => {
      const pending = new BigNumber(vote.pending.toString());
      const active = new BigNumber(vote.active.toString());

      const activatable =
        pending.gt(0)
          ? await client.readContract({
              address: electionAddress,
              abi: ELECTION_ABI,
              functionName: "hasActivatablePendingVotes",
              args: [signerAddress as `0x${string}`, vote.group],
            })
          : false;

      let activeVoteRevokable = true;

      if (pending.gt(0)) {
        activeVoteRevokable = false;
        votes.push({
          validatorGroup: vote.group,
          amount: pending,
          activatable,
          revokable: true,
          index: 0,
          type: "pending",
        });
      }

      if (active.gt(0)) {
        votes.push({
          validatorGroup: vote.group,
          amount: active,
          activatable: false,
          revokable: activeVoteRevokable,
          index: 1,
          type: "active",
        });
      }
    }),
  );

  return votes;
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
      abi: ACCOUNTS_ABI,
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

  const maxFeePerGas =
    ((gasPrice - maxPriorityFeePerGas) * BigInt(120)) / BigInt(100) + maxPriorityFeePerGas;

  return { maxFeePerGas, maxPriorityFeePerGas };
};
