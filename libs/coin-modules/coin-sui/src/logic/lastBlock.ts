import { BlockInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { BLOCK_HEIGHT, getLastBlock } from "../network/sdk";

export async function lastBlock(): Promise<BlockInfo> {
  const hash = await getLastBlock();

  return {
    height: BLOCK_HEIGHT,
    hash,
  };
}
