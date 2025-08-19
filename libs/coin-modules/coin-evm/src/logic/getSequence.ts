import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export function getSequence(currency: CryptoCurrency, address: string): Promise<number> {
  return getNodeApi(currency).getTransactionCount(currency, address);
}
