import { assertBlockHeight } from "@ledgerhq/coin-module-framework/api/getBlock/assertBlockHeight";
import type { Block } from "@ledgerhq/coin-module-framework/api/index";
import type { FilecoinContext } from "../../config";
import { fetchBlockscoutBlockTransactions } from "../../network/blockscout";
import { getBlockInfo } from "./getBlockInfo";

// Block data comes from Blockscout, see `getBlockInfo`. Addresses are the 0x ones it returns,
// not the f1/f3 ones of `listOperations`.
export async function getBlock(context: FilecoinContext, height: number): Promise<Block> {
  assertBlockHeight(height);
  const { indexer } = await context.config();

  // `info` comes from `getBlockInfo`, so that both methods answer the same for a height. The
  // transactions are read by its hash: recent blocks are not final, and a reorg between two
  // requests by height could return the transactions of another block.
  const info = await getBlockInfo(context, height);
  const transactions = await fetchBlockscoutBlockTransactions(indexer, info.hash);

  return { info, transactions };
}
