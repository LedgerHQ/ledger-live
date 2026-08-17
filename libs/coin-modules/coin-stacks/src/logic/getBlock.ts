import type { Block } from "@ledgerhq/coin-module-framework/api/index";

/** Not supported: no "list every transaction in a block" endpoint exists for Stacks (only the
 * per-address listing used by `listOperations`). `getBlockInfo` covers per-height metadata. */
export async function getBlock(_height: number): Promise<Block> {
  throw new Error("getBlock is not supported");
}
