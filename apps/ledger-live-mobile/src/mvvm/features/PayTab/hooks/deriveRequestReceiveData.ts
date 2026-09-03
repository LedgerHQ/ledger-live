import type { Account } from "@ledgerhq/types-live";
import type { RequestReceiveAsset, RequestReceiveIconProps } from "@features/flow-pay-request";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getFreshAccountAddress } from "~/utils/address";

export type RequestReceiveData = Readonly<{
  address: string;
  asset: RequestReceiveAsset;
  network: string;
  assetIcon: RequestReceiveIconProps;
  networkIcon: RequestReceiveIconProps;
}>;

export function deriveRequestReceiveData(
  account: Account,
  currency: CryptoOrTokenCurrency,
): RequestReceiveData {
  const networkCurrency = account.currency;

  return {
    address: getFreshAccountAddress(account),
    asset: { name: currency.name, ticker: currency.ticker },
    network: networkCurrency.name,
    assetIcon: {
      ledgerId: currency.id,
      ticker: currency.ticker,
      network: networkCurrency.id,
    },
    networkIcon: { ledgerId: networkCurrency.id, ticker: networkCurrency.ticker },
  };
}
