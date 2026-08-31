import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { RequestReceiveAsset, RequestReceiveIconProps } from "@features/flow-pay-request";

export type RequestReceiveData = Readonly<{
  address: string;
  asset: RequestReceiveAsset;
  network: string;
  assetIcon: RequestReceiveIconProps;
  networkIcon: RequestReceiveIconProps;
}>;

export function deriveRequestReceiveData(
  account: AccountLike,
  parentAccount?: Account,
): RequestReceiveData {
  const currency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const networkCurrency = mainAccount.currency;

  return {
    address: mainAccount.freshAddress,
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
