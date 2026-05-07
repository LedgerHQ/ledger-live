import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchLedgerRecord } from "../network";

/**
 * Returns lightweight metadata for a Stellar closed ledger at the given sequence.
 *
 * Fetches the ledger once. When `height > 1` and Horizon provides `prev_hash`,
 * `BlockInfo.parent` is derived without a second request; otherwise the parent
 * ledger is loaded explicitly. Genesis ledger sequence 1 has no parent.
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlockInfo: height must be a positive integer, got ${height}`);
  }

  const ledger = await fetchLedgerRecord(height);

  const info: BlockInfo = {
    height: ledger.sequence,
    hash: ledger.hash,
    time: new Date(ledger.closed_at),
  };

  let parent: BlockInfo["parent"];
  if (height > 1) {
    const prevHash = (ledger as { prev_hash?: string }).prev_hash;
    if (prevHash) {
      parent = { height: height - 1, hash: prevHash };
    } else {
      const parentLedger = await fetchLedgerRecord(height - 1);
      parent = { height: parentLedger.sequence, hash: parentLedger.hash };
    }
    info.parent = parent;
  }

  return info;
}
