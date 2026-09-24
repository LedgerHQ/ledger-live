import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import { apiClient } from "../network/api";
import type { HederaCoinConfig } from "../types";

/** Hedera account metadata exposed through the generic `getAccountInfo` contract (ADR-045). */
export type HederaAccountInfo = {
  type: "hedera";
  maxAutomaticTokenAssociations: number;
  stakedNodeId: number | null;
  balance: number;
  pendingReward: number;
};

// `getBalance` fetches the same mirror account without exposing it, so a generic sync makes this
// request twice.
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
