import { tapByText } from "../../helpers";

export default class CryptoDrawer {
  selectCurrencyFromDrawer(currencyName: string) {
    return tapByText(currencyName);
  }

  selectAccountFromDrawer(accountName: string) {
    return tapByText(accountName);
  }
}
