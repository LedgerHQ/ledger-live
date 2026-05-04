import type { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { initialBitcoinResourcesValue } from "@ledgerhq/coin-bitcoin/types";

export function clearAccount(account: BitcoinAccount): void {
  account.bitcoinResources = initialBitcoinResourcesValue;
}
