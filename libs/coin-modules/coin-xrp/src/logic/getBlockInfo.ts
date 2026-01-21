import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedgerInfoByIndex } from "../network";

export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height <= 0) {
    return { height };
  }

  const result = await getLedgerInfoByIndex(height);
  return {
    height: result.ledger_index,
    hash: result.ledger.ledger_hash,
    time: new Date(result.ledger.close_time_iso),
    parent: {
      height: result.ledger_index - 1,
      hash: result.ledger.parent_hash,
    },
  };
}
