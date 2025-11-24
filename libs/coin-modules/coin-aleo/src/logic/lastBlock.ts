import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

export async function lastBlock(): Promise<BlockInfo> {
  throw new Error("lastBlock is not supported");
}
