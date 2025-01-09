import React, { useCallback, useState } from "react";

import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { AccountLike } from "@ledgerhq/types-live";

import { AccountLikeEnhanced } from "../../screens/ScanDeviceAccounts/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import AccountListDrawer from "../AccountListDrawer";
import AccountQuickActionsDrawer from "../AccountQuickActionsDrawer";

export default function AddFundsButton({
  accounts,
  currency,
}: {
  accounts: AccountLikeEnhanced[];
  currency: CryptoOrTokenCurrency;
}) {
  const { t } = useTranslation();
  const [isAccountListDrawerOpen, setIsAccountListDrawerOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountLike | null>(null);
  const openAccountListDrawer = () => {
    track("button_clicked", { button: "Add a new account" });
    setIsAccountListDrawerOpen(true);
  };

  const closeAccountListDrawer = () => setIsAccountListDrawerOpen(false);

  const handleOnSelectAccoount = useCallback((account: AccountLike) => {
    closeAccountListDrawer();
    setSelectedAccount(account);
  }, []);

  const handleOnCloseQuickActions = () => {
    setSelectedAccount(null);
  };

  return (
    <>
      <Button
        size="large"
        type="shade"
        testID="button-create-account"
        onPress={openAccountListDrawer}
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
        isOpen={!!selectedAccount}
        onClose={handleOnCloseQuickActions}
        onBack={handleOnCloseQuickActions}
        account={selectedAccount}
        currency={currency}
      />
    </>
  );
}
