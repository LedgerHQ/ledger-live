import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchLedgerRecord } from "../network/horizon";

/**
 * Returns lightweight metadata for a Stellar closed ledger at the given sequence.
 *
 * Fetches the ledger and its predecessor in parallel so that `BlockInfo.parent`
 * is populated without adding serial latency (except for genesis ledger 1, which
 * has no parent in this representation).
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlockInfo: height must be a positive integer, got ${height}`);
  }

  const [ledger, parentLedger] = await Promise.all([
    fetchLedgerRecord(height),
    height > 1 ? fetchLedgerRecord(height - 1) : Promise.resolve(null),
  ]);

  const info: BlockInfo = {
    height: ledger.sequence,
    hash: ledger.hash,
    time: new Date(ledger.closed_at),
  };

  if (parentLedger) {
    info.parent = { height: parentLedger.sequence, hash: parentLedger.hash };
  }

  return info;
}
