import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function getNextSequence(
  context: EvmContext,
  currencyId: string,
  address: string,
): Promise<bigint> {
  const config = await context.config(currencyId);
  const txCount = await getNodeApi(config, currencyId).getTransactionCount(currencyId, address);
  return typeof txCount === "number" ? BigInt(txCount) : txCount;
}
