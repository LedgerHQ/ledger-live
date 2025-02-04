import React, { useCallback, useState } from "react";

import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { Account, AccountLike } from "@ledgerhq/types-live";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import AccountListDrawer from "../AccountListDrawer";
import AccountQuickActionsDrawer from "../AccountQuickActionsDrawer";
import useAnalytics from "LLM/hooks/useAnalytics";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

export default function AddFundsButton({
  accounts,
  currency,
  sourceScreenName,
}: {
  accounts: Account[];
  currency: CryptoOrTokenCurrency;
  sourceScreenName: string;
}) {
  const { t } = useTranslation();
  const [isAccountListDrawerOpen, setIsAccountListDrawerOpen] = useState<boolean>(false);
  const [isAccountQuickActionsDrawerOpen, setIsAccountQuickActionsDrawerOpen] =
    useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(
    accounts.length === 1 ? accounts[0] : null,
  );
  const { analyticsMetadata } = useAnalytics("addAccounts", sourceScreenName);

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

  const handleOnSelectAccoount = useCallback(
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

  return (
    <>
      <Button
        size="large"
        type="shade"
        testID="button-create-account"
        onPress={openFundOrAccountListDrawer}
      >
        {t("addAccounts.addAccountsSuccess.ctaAddFunds")}
      </Button>
      <AccountListDrawer
        isOpen={isAccountListDrawerOpen}
        onClose={closeAccountListDrawer}
        data={accounts}
        onPressAccount={handleOnSelectAccoount}
      />
      <AccountQuickActionsDrawer
        isOpen={isAccountQuickActionsDrawerOpen}
        onClose={handleOnCloseQuickActions}
        account={selectedAccount}
        currency={currency}
      />
    </>
  );
}
