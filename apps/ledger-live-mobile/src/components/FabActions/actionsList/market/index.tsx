import React, { memo } from "react";

import { AccountLike, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import useAssetActions from "../../hooks/useAssetActions";
import FabAccountButtonBar from "../account/FabAccountButtonBar";

type Props = {
  account?: AccountLike;
  parentAccount?: Account;
  currency?: CryptoCurrency | TokenCurrency;
  accounts?: AccountLike[];
};

const FabMarketActionsComponent: React.FC<Props> = ({
  currency,
  accounts,
  ...props
}) => {
  const { mainActions } = useAssetActions({ currency, accounts });

  return <FabAccountButtonBar {...props} buttons={mainActions} />;
};

export const FabMarketActions = memo(FabMarketActionsComponent);
