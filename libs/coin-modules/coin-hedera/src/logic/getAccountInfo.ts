import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import { apiClient } from "../network/api";
import type { HederaCoinConfig } from "../types";

export type HederaAccountInfo = {
  type: "hedera";
  maxAutomaticTokenAssociations: number;
  stakedNodeId: number | null;
  balance: number;
  pendingReward: number;
};

export async function getAccountInfo(
  config: HederaCoinConfig,
  address: string,
): Promise<AccountInfo> {
  const mirrorAccount = await apiClient.getAccount({ configOrCurrencyId: config, address });

  const accountInfo: HederaAccountInfo = {
    type: "hedera",
    maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
    stakedNodeId: mirrorAccount.staked_node_id,
    balance: mirrorAccount.balance.balance,
    pendingReward: mirrorAccount.pending_reward,
  };

  return accountInfo;
}
