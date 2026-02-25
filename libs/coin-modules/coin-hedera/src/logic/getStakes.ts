import type { Page, Stake } from "@ledgerhq/coin-framework/api/types";
import { apiClient } from "../network/api";

/**
 * Fetch stakes for a given Hedera account.
 */
export async function getStakes(address: string): Promise<Page<Stake>> {
  const [mirrorAccount, mirrorNodes] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getNodes({ fetchAllPages: true }),
  ]);

  const stakedNodeId = mirrorAccount.staked_node_id;

  if (typeof stakedNodeId !== "number") {
    return { items: [] };
  }

  const delegatedNode = mirrorNodes.nodes.find(node => node.node_id === stakedNodeId);
  const balance = BigInt(mirrorAccount.balance.balance);
  const pendingReward = BigInt(mirrorAccount.pending_reward);

  const stake: Stake = {
    uid: address,
    address,
    asset: { type: "native" },
    state: delegatedNode ? "active" : "inactive",
    amount: balance + pendingReward,
    amountDeposited: balance,
    amountRewarded: pendingReward,
    details: {
      stakedNodeId,
      overstaked: delegatedNode
        ? BigInt(delegatedNode.stake) >= BigInt(delegatedNode.max_stake)
        : null,
    },
    ...(delegatedNode && {
      delegate: delegatedNode.node_account_id,
    }),
  };

  return { items: [stake] };
}
