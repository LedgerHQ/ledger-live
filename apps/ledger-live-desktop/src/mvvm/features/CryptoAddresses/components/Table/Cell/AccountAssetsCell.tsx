import React from "react";
import type { AccountAssetCurrency } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import { AccountAssetsCellView } from "./AccountAssetsCellView";
import { useAccountAssetsCellViewModel } from "./useAccountAssetsCellViewModel";

type AccountAssetsCellProps = {
  readonly currencies: AccountAssetCurrency[];
};

export function AccountAssetsCell({ currencies }: AccountAssetsCellProps) {
  const viewModel = useAccountAssetsCellViewModel(currencies);

  if (viewModel.isEmpty) {
    return null;
  }

  return <AccountAssetsCellView {...viewModel} />;
}
