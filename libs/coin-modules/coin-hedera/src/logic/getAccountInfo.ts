import type { AccountInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { HederaCoinConfig } from "../config";
import { apiClient } from "../network/api";

/**
 * Hedera-specific account metadata exposed through the generic `getAccountInfo` contract
 * (ADR-045), mapped onto `hederaResources` by `buildAccountShape`
 * (ledger-live-common's `families/hedera/bridge/api.ts`) — the shared account shape has no room
 * for automatic-association settings or the staked node id.
 */
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

  return {
    type: "hedera",
    maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
    stakedNodeId: mirrorAccount.staked_node_id,
    balance: mirrorAccount.balance.balance,
    pendingReward: mirrorAccount.pending_reward,
  } satisfies HederaAccountInfo;
}
