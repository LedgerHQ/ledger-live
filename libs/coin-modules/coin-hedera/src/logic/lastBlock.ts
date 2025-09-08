import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

export async function lastBlock(): Promise<BlockInfo> {
  // NOTE: there are no "blocks" in hedera
  // Set a value just so that operations are considered confirmed according to isConfirmedOperation
  return {
    height: 10,
  };
}
