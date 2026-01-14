import type { Page, Reward } from "@ledgerhq/coin-framework/api/types";
import { apiClient } from "../network/api";

/**
 * Fetch staking rewards for a given Hedera account.
 */
export async function getRewards(address: string, cursor?: string): Promise<Page<Reward>> {
  const mirrorTransactions = await apiClient.getAccountTransactions({
    address,
    fetchAllPages: false,
    pagingToken: cursor ?? null,
    limit: 100,
    order: "desc",
  });

  const rewards = mirrorTransactions.transactions.reduce<Reward[]>((acc, tx) => {
    const reward = tx.staking_reward_transfers.find(r => r.account === address);
    if (!reward) return acc;

    const timestamp = new Date(Number.parseInt(tx.consensus_timestamp.split(".")[0], 10) * 1000);

    acc.push({
      stake: address,
      asset: { type: "native" },
      amount: BigInt(reward.amount),
      receivedAt: timestamp,
      transactionHash: tx.transaction_hash,
    });

    return acc;
  }, []);

  return {
    items: rewards,
    ...(mirrorTransactions.nextCursor && { next: mirrorTransactions.nextCursor }),
  };
}
