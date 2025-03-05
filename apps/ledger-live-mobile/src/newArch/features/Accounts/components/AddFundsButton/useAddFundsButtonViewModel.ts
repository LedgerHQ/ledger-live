import { getDefaultAccountName } from "@ledgerhq/live-wallet/lib/accountName";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useState, useCallback } from "react";
import { track } from "~/analytics";
import useAnalytics from "LLM/hooks/useAnalytics";
import { AnalyticContexts } from "LLM/hooks/useAnalytics/enums";

export type Props = {
  accounts: Account[];
  currency: CryptoOrTokenCurrency;
  sourceScreenName: string;
};

export default function useAddFundsButtonViewModel({
  accounts,
  currency,
  sourceScreenName,
}: Props) {
  const [isAccountListDrawerOpen, setIsAccountListDrawerOpen] = useState<boolean>(false);
  const [isAccountQuickActionsDrawerOpen, setIsAccountQuickActionsDrawerOpen] =
    useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(
    accounts.length === 1 ? accounts[0] : null,
  );
  const { analyticsMetadata } = useAnalytics(AnalyticContexts.AddAccounts);

  const openFundOrAccountListDrawer = useCallback(() => {
    let clickMetadata;
    if (accounts.length === 1) {
      clickMetadata = analyticsMetadata.AddFunds?.onQuickActionOpen;
      setIsAccountQuickActionsDrawerOpen(true);
    } else {
      clickMetadata = analyticsMetadata.AddFunds?.onOpenDrawer;
      setIsAccountListDrawerOpen(true);
    }
    track(clickMetadata.eventName, clickMetadata.payload);
  }, [
    accounts.length,
    analyticsMetadata.AddFunds?.onQuickActionOpen,
    analyticsMetadata.AddFunds?.onOpenDrawer,
  ]);

  const closeAccountListDrawer = useCallback(() => {
    const clickMetadata = analyticsMetadata.AddFunds?.onCloseDrawer;
    setIsAccountListDrawerOpen(false);
    track(clickMetadata.eventName, clickMetadata.payload);
  }, [analyticsMetadata.AddFunds?.onCloseDrawer]);

  const handleOnSelectAccount = useCallback(
    (account: AccountLike) => {
      closeAccountListDrawer();
      setSelectedAccount(account);
      setIsAccountQuickActionsDrawerOpen(true);
      const selectAccountMetadata = analyticsMetadata.AddFunds?.onSelectAccount;
      track(selectAccountMetadata.eventName, {
        ...selectAccountMetadata.payload,
        account: getDefaultAccountName(account),
        currency: currency.id,
      });
    },
    [closeAccountListDrawer, currency, analyticsMetadata.AddFunds?.onSelectAccount],
  );

  const handleOnCloseQuickActions = () => {
    const clickMetadata = analyticsMetadata.AddFunds?.onQuickActionClose;
    setIsAccountQuickActionsDrawerOpen(false);
    track(clickMetadata.eventName, clickMetadata.payload);
  };
  return {
    isAccountListDrawerOpen,
    isAccountQuickActionsDrawerOpen,
    selectedAccount,
    accounts,
    currency,
    openFundOrAccountListDrawer,
    closeAccountListDrawer,
    handleOnSelectAccount,
    handleOnCloseQuickActions,
    sourceScreenName,
  };
}
