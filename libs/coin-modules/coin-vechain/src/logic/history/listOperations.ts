import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { getLastBlockHeight, getOperations, getTokenOperations } from "../../network";
import { NATIVE_ASSET, vthoAsset } from "../account/getBalance";

function toFrameworkOperation(op: LegacyOperation, asset: AssetInfo): Operation<MemoNotSupported> {
  return {
    id: op.id,
    type: op.type,
    senders: op.senders,
    recipients: op.recipients,
    value: BigInt(op.value.toFixed(0)),
    asset,
    details: { ledgerOpType: op.type },
    tx: {
      hash: op.hash,
      block: { height: op.blockHeight ?? 0, hash: op.blockHash ?? "", time: op.date },
      fees: asset.type === "native" ? 0n : BigInt((op.fee ?? 0).toFixed(0)),
      date: op.date,
      failed: op.hasFailed ?? false,
    },
  };
}

function parseCursor(options: ListOperationsOptions): number {
  const parsed = options.cursor ? Number.parseInt(options.cursor, 10) : Number.NaN;
  const fromCursor = !Number.isNaN(parsed) && parsed >= 1 ? parsed : 1;
  return Math.max(fromCursor, options.minHeight || 0);
}

// Merged VET + VTHO operations; `next` is one block past the current head for incremental resume.
export async function listOperations(
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const startAt = parseCursor(options);
  const stopAt = await getLastBlockHeight();

  if (startAt > stopAt) {
    return { items: [], next: String(startAt) };
  }

  const [vetOps, vthoOps] = await Promise.all([
    getOperations(address, address, startAt, stopAt),
    getTokenOperations(address, address, VTHO_ADDRESS, startAt, stopAt),
  ]);

  const items = [
    ...vetOps.map(op => toFrameworkOperation(op, NATIVE_ASSET)),
    ...vthoOps.map(op => toFrameworkOperation(op, vthoAsset(address))),
  ].sort((a, b) => b.tx.date.getTime() - a.tx.date.getTime());

  return {
    items,
    next: String(stopAt + 1),
  };
}
