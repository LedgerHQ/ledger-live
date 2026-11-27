import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getConsensusInfo } from "../../network/proxyClient";
import type { ConcordiumContext } from "../../types";

export async function lastBlock(context: ConcordiumContext): Promise<BlockInfo> {
  const info = await getConsensusInfo(context);

  return {
    height: info.lastFinalizedBlockHeight,
    hash: info.lastFinalizedBlock,
    time: new Date(info.lastFinalizedTime ?? Date.now()),
  };
}
