import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { getCurrentBlock } from "../network";

/**
 * Latest confirmed block for the account's currency.
 *
 * Bitcoin has no probabilistic-finality tag exposed by the explorer, so the explorer's current
 * (tip) block is returned. `time` is a `Date` as required by the framework.
 */
export async function lastBlock(context: BitcoinContext, currencyId: string): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  const block = await getCurrentBlock(currencyId, config);
  if (!block) {
    throw new Error("lastBlock: explorer returned no current block");
  }
  return {
    height: block.height,
    hash: block.hash,
    time: new Date(block.time),
  };
}
