import { initialBitcoinResourcesValue, type BitcoinAccount } from "./types";

export function clearAccount(account: BitcoinAccount): void {
  account.bitcoinResources = initialBitcoinResourcesValue;
}
