import type { Page, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { HederaCoinConfig } from "../config";
import { apiClient } from "../network/api";

/**
 * Fetch stakes for a given Hedera account.
 */
export async function getStakes({
  configOrCurrencyId,
  address,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  address: string;
}): Promise<Page<Stake>> {
  const mirrorAccount = await apiClient.getAccount({ configOrCurrencyId, address });
  const stakedNodeId = mirrorAccount.staked_node_id;

  if (typeof stakedNodeId !== "number") {
    return { items: [] };
  }

  // -1 is used by the mirror node to indicate the account is no longer delegated
  // to any node (e.g. after an undelegation). In that case we skip the node lookup.
  const delegatedNode =
    stakedNodeId >= 0
      ? await apiClient.getNode({ configOrCurrencyId, nodeId: stakedNodeId })
      : null;
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
    actions: [],
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
