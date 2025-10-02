import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

// NOTE: there are no "blocks" in hedera
// Set a value just so that operations are considered confirmed according to isConfirmedOperation
export async function lastBlock(): Promise<BlockInfo> {
  return {
    height: 10,
  };
}
