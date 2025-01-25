import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import api from "../network";

export async function lastBlock(): Promise<BlockInfo> {
  const result = await api.getLastBlock();

  return {
    height: result.height,
    hash: result.hash,
    time: result.time,
  };
}
