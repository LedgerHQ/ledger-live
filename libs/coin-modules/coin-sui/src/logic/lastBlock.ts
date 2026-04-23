import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getLastBlock } from "../network/sdk";

export async function lastBlock(currencyId?: string): Promise<BlockInfo> {
  const { digest, sequenceNumber, timestampMs } = await getLastBlock(currencyId);

  return {
    height: Number(sequenceNumber),
    hash: digest,
    time: new Date(parseInt(timestampMs)),
  };
}
