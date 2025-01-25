import React, { memo } from "react";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { QuickActionList } from "@ledgerhq/native-ui";

import useAssetActions from "../../hooks/useAssetActions";
import { FabButtonBarProvider } from "../../index";

type Props = {
  defaultAccount?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLike[];
};

const FabAssetActionsComponent: React.FC<Props> = ({ currency, accounts, defaultAccount }) => {
  const { mainActions } = useAssetActions({ currency, accounts });

  return (
    <FabButtonBarProvider
      actions={mainActions}
      modalOnDisabledClickProps={{ currency, account: defaultAccount }}
    >
      {({ quickActions }) => (
        <>
          {quickActions.length === 2 || quickActions.length === 4 ? (
            <QuickActionList
              data={quickActions}
              numColumns={2}
              id="asset_two_columns"
              key="asset_two_columns"
              testID="asset-quick-action-button"
            />
          ) : (
            <QuickActionList
              data={quickActions}
              numColumns={3}
              id="asset_three_columns"
              key="asset_three_columns"
              testID="asset-quick-action-button"
            />
          )}
        </>
      )}
    </FabButtonBarProvider>
  );
};

export const FabAssetActions = memo(FabAssetActionsComponent);
