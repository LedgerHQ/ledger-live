import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

export async function lastBlock(): Promise<BlockInfo> {
  return {
    height: 0,
  };
}
