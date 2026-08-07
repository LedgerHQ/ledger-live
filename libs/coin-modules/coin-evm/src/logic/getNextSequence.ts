import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function getNextSequence(
  context: EvmContext,
  currency: CryptoCurrency,
  address: string,
): Promise<bigint> {
  const config = await context.config(currency.id);
  const txCount = await getNodeApi(config, currency).getTransactionCount(currency, address);
  return typeof txCount === "number" ? BigInt(txCount) : txCount;
}
