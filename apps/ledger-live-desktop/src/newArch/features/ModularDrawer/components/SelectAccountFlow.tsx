import React from "react";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";

type SelectAccountDrawerProps = {
  assetIds?: string[];
  includeTokens?: boolean;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  currenciesArray?: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
};

export function SelectAccountFlow({
  assetIds,
  includeTokens,
  currenciesArray,
  ...props
}: SelectAccountDrawerProps) {
  const currencies =
    currenciesArray ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });
  return <SelectAccountAndCurrencyDrawer {...props} currencies={currencies} />;
}
