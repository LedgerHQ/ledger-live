import React, { memo } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { QuickActionList } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";

import { FabButtonBarProvider } from "../../index";
import useAccountActions from "~/screens/Account/hooks/useAccountActions";
import FabButtonBar from "../../FabButtonBar";

type FabAccountActionsProps = {
  account: AccountLike;
  parentAccount?: Account;
};

export const FabAccountMainActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();

  const { mainActions } = useAccountActions({ account, parentAccount, colors });

  return (
    <FabButtonBarProvider
      actions={mainActions}
      modalOnDisabledClickProps={{ account, parentAccount }}
      navigationProps={{ accountId: account.id, parentId: parentAccount?.id }}
    >
      {({ quickActions }) => (
        <>
          {quickActions.length === 2 || quickActions.length === 4 ? (
            <QuickActionList
              data={quickActions}
              numColumns={2}
              id="two_columns"
              key="two_columns"
              testID="account-quick-action-button"
            />
          ) : (
            <QuickActionList
              data={quickActions}
              numColumns={3}
              id="three_columns"
              key="three_columns"
              testID="account-quick-action-button"
            />
          )}
        </>
      )}
    </FabButtonBarProvider>
  );
};

export const FabAccountActionsComponent: React.FC<FabAccountActionsProps> = ({
  account,
  parentAccount,
}: FabAccountActionsProps) => {
  const { colors } = useTheme();
  const { secondaryActions } = useAccountActions({
    account,
    parentAccount,
    colors,
  });
  return (
    <FabButtonBarProvider
      actions={secondaryActions}
      modalOnDisabledClickProps={{ account, parentAccount }}
      navigationProps={{ accountId: account.id, parentId: parentAccount?.id }}
    >
      {({ quickActions }) => <FabButtonBar data={quickActions} />}
    </FabButtonBarProvider>
  );
};

export const FabAccountActions = memo(FabAccountActionsComponent);
export const FabAccountMainActions = memo(FabAccountMainActionsComponent);
