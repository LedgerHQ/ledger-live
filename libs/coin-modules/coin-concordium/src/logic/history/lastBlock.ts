import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getConsensusInfo } from "../../network/proxyClient";

export async function lastBlock(currencyId: string): Promise<BlockInfo> {
  const info = await getConsensusInfo(currencyId);

  return {
    height: info.lastFinalizedBlockHeight,
    hash: info.lastFinalizedBlock,
    time: new Date(info.lastFinalizedTime ?? Date.now()),
  };
}
