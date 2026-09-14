import type {
  AssetInfo,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Operation as LegacyOperation } from "@ledgerhq/types-live";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import type { VechainContext } from "../../config";
import { getLastBlockHeight, getOperations, getTokenOperations } from "../../network";
import { NATIVE_ASSET, vthoAsset } from "../account/getBalance";

function readGasPayer(op: LegacyOperation): string | undefined {
  const gasPayer = (op.extra as { gasPayer?: unknown } | undefined)?.gasPayer;
  return typeof gasPayer === "string" && gasPayer.length > 0 ? gasPayer : undefined;
}

// VeChain gas is always paid in VTHO, never in VET, so the fee on a VET operation is denominated in
// a different asset than the amount. The family declares that through `feesCurrencyId` on its
// `BridgeApi`, which stops the generic coin framework from folding `tx.fees` into the operation
// value and renders the fee in VTHO — so the real gas can be reported on every operation.
function toFrameworkOperation(op: LegacyOperation, asset: AssetInfo): Operation<MemoNotSupported> {
  const gasPayer = readGasPayer(op);

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
      fees: BigInt((op.fee ?? 0).toFixed(0)),
      ...(gasPayer ? { feesPayer: gasPayer } : {}),
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

// Merged VET + VTHO operations. A page is never partial: getOperations/getTokenOperations exhaust
// [startAt, head] within this call (splitting the block range until the node accepts it), so there
// is no next page to advertise and `next` stays unset — a cursor on a complete (or empty) page traps
// a client that pages until `next` is falsy. Resume across syncs is driven by `minHeight`.
export async function listOperations(
  context: VechainContext,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const config = await context.config();
  const startAt = parseCursor(options);
  const stopAt = await getLastBlockHeight(config);

  if (startAt > stopAt) {
    return { items: [] };
  }

  const [vetOps, vthoOps] = await Promise.all([
    getOperations(config, address, address, startAt, stopAt),
    getTokenOperations(config, address, address, VTHO_ADDRESS, startAt, stopAt),
  ]);

  const items = [
    ...vetOps.map(op => toFrameworkOperation(op, NATIVE_ASSET)),
    ...vthoOps.map(op => toFrameworkOperation(op, vthoAsset(address))),
  ].sort((a, b) =>
    options.order === "asc"
      ? a.tx.date.getTime() - b.tx.date.getTime()
      : b.tx.date.getTime() - a.tx.date.getTime(),
  );

  return { items };
}
