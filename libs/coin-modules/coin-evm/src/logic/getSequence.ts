import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";

export async function getSequence(currency: CryptoCurrency, address: string): Promise<bigint> {
  const txCount = await getNodeApi(currency).getTransactionCount(currency, address);
  return typeof txCount === "number" ? BigInt(txCount) : txCount;
}
