import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { TokenAccount } from "@ledgerhq/types-live";

export type SolanaDetailAccount = SolanaAccount | TokenAccount;

export type AccountDetailSectionViewModel = Readonly<{
  account: SolanaDetailAccount;
  showBalanceSummary: boolean;
  showDelegations: boolean;
}>;

const isDelegationDisabled = (currencyId: string): boolean => {
  try {
    return getCurrencyConfiguration(currencyId).disableDelegation === true;
  } catch {
    return false;
  }
};

export const useAccountDetailSectionViewModel = (
  account: SolanaDetailAccount,
  parentAccount?: SolanaAccount | null,
): AccountDetailSectionViewModel => {
  const bridge = useAccountBridgeOrNull(
    account.type === "Account" ? account : null,
    parentAccount ?? null,
  );
  const isEmpty = bridge ? bridge.isAccountEmpty(account) : true;
  const showStakingBlocks = account.type === "Account" && !isEmpty;

  return {
    account,
    showBalanceSummary: showStakingBlocks && !isDelegationDisabled(account.currency.id),
    showDelegations: showStakingBlocks,
  };
};
