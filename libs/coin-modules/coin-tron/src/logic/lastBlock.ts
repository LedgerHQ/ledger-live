import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLastBlock } from "../network";

export async function lastBlock(): Promise<BlockInfo> {
  const block = await getLastBlock();
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}
