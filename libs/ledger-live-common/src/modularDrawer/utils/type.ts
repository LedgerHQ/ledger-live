export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

export type ProviderBalanceAsset = {
  id: string;
  name: string;
  ticker: string;
  balance: string;
  fiatValue: string;
  sortValue: number;
};

export type ProviderBalanceResultsMap = Map<string, ProviderBalanceAsset>;

export type AssetWithBalance = AssetType & {
  sortValue?: number;
};
