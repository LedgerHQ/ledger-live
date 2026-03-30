import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import type { ChainAPI } from "../network";

export async function lastBlock(api: ChainAPI): Promise<BlockInfo> {
  const {
    context: { slot },
    value: { blockhash },
  } = await api.connection.getLatestBlockhashAndContext();
  const blockTime = await api.connection.getBlockTime(slot);

  return {
    height: slot,
    hash: blockhash,
    time: blockTime ? new Date(blockTime * 1000) : new Date(),
  };
}
