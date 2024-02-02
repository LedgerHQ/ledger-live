import type { BitcoinAccount } from "./types";
import { perCoinLogic } from "./logic";

function injectGetAddressParams(account: BitcoinAccount): any {
  const perCoin = perCoinLogic[account.currency.id];

  if (perCoin && perCoin.injectGetAddressParams) {
    return perCoin.injectGetAddressParams(account);
  }
}

export default {
  injectGetAddressParams,
};
