import React from "react";
import { Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import AccountListDrawer from "../AccountListDrawer";
import AccountQuickActionsDrawer from "../AccountQuickActionsDrawer";
import useAddFundsButtonViewModel, { type Props } from "./useAddFundsButtonViewModel";

type ViewProps = ReturnType<typeof useAddFundsButtonViewModel>;

function View({
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
}: ViewProps) {
  const { t } = useTranslation();

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
        onPressAccount={handleOnSelectAccount}
        sourceScreenName={sourceScreenName}
      />
      {selectedAccount && (
        <AccountQuickActionsDrawer
          isOpen={isAccountQuickActionsDrawerOpen}
          onClose={handleOnCloseQuickActions}
          account={selectedAccount}
          currency={currency}
          sourceScreenName={sourceScreenName}
        />
      )}
    </>
  );
}

const AddFundsButton: React.FC<Props> = props => <View {...useAddFundsButtonViewModel(props)} />;

export default AddFundsButton;
