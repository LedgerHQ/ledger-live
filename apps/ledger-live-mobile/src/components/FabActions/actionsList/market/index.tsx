import React, { memo } from "react";

import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import useAssetActions from "../../hooks/useAssetActions";
import { FabButtonBarProvider } from "../../index";
import FabButtonBar from "../../FabButtonBar";

type Props = {
  defaultAccount?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLike[];
};

const FabMarketActionsComponent: React.FC<Props> = ({
  currency,
  accounts,
  defaultAccount,
}) => {
  const { mainActions } = useAssetActions({ currency, accounts });

  return (
    <FabButtonBarProvider
      actions={mainActions}
      modalOnDisabledClickProps={{ currency, account: defaultAccount }}
    >
      {({ quickActions }) => <FabButtonBar data={quickActions} />}
    </FabButtonBarProvider>
  );
};

export const FabMarketActions = memo(FabMarketActionsComponent);
