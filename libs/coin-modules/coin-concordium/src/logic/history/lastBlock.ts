import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getConsensusInfo } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";

export async function lastBlock(
  config: ConcordiumCoinConfig,
  currencyId: string,
): Promise<BlockInfo> {
  const info = await getConsensusInfo(config, currencyId);

  return {
    height: info.lastFinalizedBlockHeight,
    hash: info.lastFinalizedBlock,
    time: new Date(info.lastFinalizedTime ?? Date.now()),
  };
}
