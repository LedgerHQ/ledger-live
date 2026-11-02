import {
  getAddressExplorer,
  getDefaultExplorerView,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";

export type AccountExplorerSource = Readonly<{
  currency: Pick<CryptoCurrency, "explorerViews">;
  freshAddress: string;
}>;

export function getAccountExplorerUrl({
  currency,
  freshAddress,
}: AccountExplorerSource): string | undefined {
  return getAddressExplorer(getDefaultExplorerView(currency), freshAddress);
}
