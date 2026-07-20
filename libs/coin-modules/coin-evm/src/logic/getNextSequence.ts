import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { getNodeApi } from "../network/node";

export async function getNextSequence(currency: CryptoCurrency, address: string): Promise<bigint> {
  const txCount = await getNodeApi(currency).getTransactionCount(currency, address);
  return typeof txCount === "number" ? BigInt(txCount) : txCount;
}
