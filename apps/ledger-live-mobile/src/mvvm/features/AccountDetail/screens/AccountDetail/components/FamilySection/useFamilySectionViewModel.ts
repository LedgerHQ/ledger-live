import { useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { useAccountNotices, type AccountNoticesResult } from "./useAccountNotices";

export type FamilySectionViewModel = AccountNoticesResult &
  Readonly<{
    account: Account;
    showEarnBlocks: boolean;
    showBodyBlocks: boolean;
  }>;

const readCurrencyConfig = (currencyId: string): CurrencyConfig | undefined => {
  try {
    return getCurrencyConfiguration(currencyId);
  } catch {
    return undefined;
  }
};

export const useFamilySectionViewModel = (account: Account): FamilySectionViewModel => {
  const bridge = useAccountBridgeOrNull(account, undefined);
  const currencyConfig = useMemo(
    () => readCurrencyConfig(account.currency.id),
    [account.currency.id],
  );
  const notices = useAccountNotices(account, currencyConfig);

  const isEmpty = bridge ? bridge.isAccountEmpty(account) : true;
  const isDelegationDisabled = currencyConfig?.disableDelegation === true;

  return {
    ...notices,
    account,
    showEarnBlocks: !isEmpty && !isDelegationDisabled,
    showBodyBlocks: !isEmpty,
  };
};
