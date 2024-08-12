import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import api from "../network/tzkt";

export async function lastBlock(): Promise<BlockInfo> {
  const result = await api.getLastBlock();

  return {
    height: result.level,
    hash: result.hash,
    time: result.date,
  };
}
