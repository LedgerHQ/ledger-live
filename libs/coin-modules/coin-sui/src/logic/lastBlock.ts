import { BlockInfo } from "@ledgerhq/coin-framework/lib/api/types";
import { getLastBlock } from "../network/sdk";

export async function lastBlock(): Promise<BlockInfo> {
  const { digest, sequenceNumber, timestampMs } = await getLastBlock();

  return {
    height: Number(sequenceNumber),
    hash: digest,
    time: new Date(parseInt(timestampMs)),
  };
}
