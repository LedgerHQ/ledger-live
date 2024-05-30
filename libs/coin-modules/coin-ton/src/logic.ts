import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import murmurhash from "imurmurhash";

const simpleSyncHashMemoize: Record<string, string> = {};
export function getSyncHash(currency: CryptoCurrency, blacklistedList: string[]): string {
  const tokens = listTokensForCryptoCurrency(currency).filter(
    token => !blacklistedList.includes(token.id),
  );
  const stringToHash = tokens
    .map(token => token.id + token.contractAddress + token.name + token.ticker + token.units)
    .join("");

  if (!simpleSyncHashMemoize[stringToHash]) {
    simpleSyncHashMemoize[stringToHash] = `0x${murmurhash(stringToHash).result().toString(16)}`;
  }
  return simpleSyncHashMemoize[stringToHash];
}
