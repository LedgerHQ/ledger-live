import React, { useCallback, useState } from "react";

import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { Account, AccountLike } from "@ledgerhq/types-live";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import AccountListDrawer from "../AccountListDrawer";
import AccountQuickActionsDrawer from "../AccountQuickActionsDrawer";

export default function AddFundsButton({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: CryptoOrTokenCurrency;
}) {
  const { t } = useTranslation();
  const [isAccountListDrawerOpen, setIsAccountListDrawerOpen] = useState<boolean>(false);
  const [isAccountQuickActionsDrawerOpen, setIsAccountQuickActionsDrawerOpen] =
    useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(
    accounts.length === 1 ? accounts[0] : null,
  );
  const openFundOrAccountListDrawer = () => {
    track("button_clicked", { button: "Add a new account" });
    if (accounts.length === 1) {
      setIsAccountQuickActionsDrawerOpen(true);
    } else setIsAccountListDrawerOpen(true);
  };

  const closeAccountListDrawer = () => setIsAccountListDrawerOpen(false);

  const handleOnSelectAccoount = useCallback((account: AccountLike) => {
    closeAccountListDrawer();
    setSelectedAccount(account);
    setIsAccountQuickActionsDrawerOpen(true);
  }, []);

  const handleOnCloseQuickActions = () => {
    setIsAccountQuickActionsDrawerOpen(false);
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
        onBack={closeAccountListDrawer}
        data={accounts}
        onPressAccount={handleOnSelectAccoount}
      />
      <AccountQuickActionsDrawer
        isOpen={isAccountQuickActionsDrawerOpen}
        onClose={handleOnCloseQuickActions}
        onBack={handleOnCloseQuickActions}
        account={selectedAccount}
        currency={currency}
      />
    </>
  );
}
