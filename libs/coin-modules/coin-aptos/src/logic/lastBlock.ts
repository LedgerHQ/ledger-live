import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { AptosAPI } from "../network";

export async function lastBlock(): Promise<BlockInfo> {
  const client = new AptosAPI("aptos");
  return await client.getLastBlock();
}
