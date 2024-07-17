import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
import { getLedger } from "../network";

export async function lastBlock(): Promise<BlockInfo> {
  const result = await getLedger();
  return {
    height: result.ledger_index,
    hash: result.ledger.ledger_hash,
    time: new Date(result.ledger.close_time_iso),
  };
}
