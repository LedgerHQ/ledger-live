import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getLastBlock } from "../network/sdk";
import type { SuiCoinConfig } from "../config";

export async function lastBlock(currencyId?: string, config?: SuiCoinConfig): Promise<BlockInfo> {
  const { digest, sequenceNumber, timestampMs } = await getLastBlock(currencyId, config);

  return {
    height: Number(sequenceNumber),
    hash: digest,
    time: new Date(parseInt(timestampMs)),
  };
}
