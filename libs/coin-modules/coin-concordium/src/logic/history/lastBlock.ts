import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getConsensusInfo } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function lastBlock(
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<BlockInfo> {
  const info = await getConsensusInfo(currencyId, config);

  return {
    height: info.lastFinalizedBlockHeight,
    hash: info.lastFinalizedBlock,
    time: new Date(info.lastFinalizedTime ?? Date.now()),
  };
}
