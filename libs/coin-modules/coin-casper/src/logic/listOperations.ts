import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { fetchTxsPage } from "../network/api";
import { ITxnHistoryData, TransferArgs } from "../types/network";
import { CasperOperation } from "../types";
import type { CasperContext } from "../types/config";
import { getEstimatedFees } from "./estimateFees";
import { casperAccountHashFromPublicKey } from "./validateAddress";

type NativeTransfer = ITxnHistoryData & { args: TransferArgs };

/** The same feed also serves staking, bid and contract deploys, which carry no transfer args. */
function isNativeTransfer(tx: ITxnHistoryData): tx is NativeTransfer {
  return typeof tx.args.amount?.parsed === "string" && typeof tx.args.target?.parsed === "string";
}

/** Both hashes are lowercase hex without an `account-hash-` prefix, so `===` compares them. */
function resolveParties(
  tx: NativeTransfer,
): { fromAccount: string; toAccount: string } | undefined {
  try {
    return {
      fromAccount: casperAccountHashFromPublicKey(tx.caller_public_key),
      toAccount:
        tx.args.target.cl_type === "PublicKey"
          ? casperAccountHashFromPublicKey(tx.args.target.parsed)
          : tx.args.target.parsed,
    };
  } catch (err) {
    log("warn", "casper: skipping deploy with an unparsable key", { tx: tx.deploy_hash, err });
    return undefined;
  }
}

function getTransferId(tx: NativeTransfer): string | undefined {
  const id = tx.args.id?.parsed;
  return typeof id === "number" ? id.toString() : undefined;
}

function toApiOperations(tx: NativeTransfer, accountHash: string): Operation[] {
  const parties = resolveParties(tx);
  if (!parties) return [];

  const { fromAccount, toAccount } = parties;
  const date = new Date(tx.timestamp);
  const transferId = getTransferId(tx);

  const buildOperation = (type: "OUT" | "IN"): Operation => ({
    id: `${tx.deploy_hash}-${type}`,
    type,
    senders: [fromAccount],
    recipients: [toAccount],
    // The adapter adds `tx.fees` back on native OUT operations, so adding it here double-counts.
    value: BigInt(tx.args.amount.parsed),
    asset: { type: "native" },
    // `Operation.memo` is `MemoNotSupported` for Casper, so the transfer id goes in `details`.
    ...(transferId !== undefined && { details: { transferId } }),
    tx: {
      hash: tx.deploy_hash,
      block: { height: tx.block_height, hash: tx.block_hash, time: date },
      fees: BigInt(tx.cost),
      feesPayer: fromAccount,
      date,
      failed: Boolean(tx.error_message),
    },
  });

  const ops: Operation[] = [];
  if (accountHash === fromAccount) ops.push(buildOperation("OUT"));
  if (accountHash === toAccount) ops.push(buildOperation("IN"));
  return ops;
}

/**
 * List an account's native CSPR transfers, newest first, down to `minHeight`.
 *
 * The indexer has no server-side filter or cursor: `minHeight` is applied while walking the feed,
 * and `cursor` / `limit` would mean re-walking from page 1 on every page, so they are rejected.
 */
export async function listOperations(
  context: CasperContext,
  address: string,
  { minHeight, cursor, limit, order }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (order !== undefined && order !== "desc") {
    throw new Error(`casper: listOperations order "${order}" is not supported`);
  }
  if (cursor !== undefined) throw new Error("casper: listOperations cursor is not supported");
  if (limit !== undefined) throw new Error("casper: listOperations limit is not supported");

  const config = await context.config();
  const accountHash = casperAccountHashFromPublicKey(address);
  const items: Operation[] = [];

  for (let page = 1; ; page++) {
    const { data, page_count } = await fetchTxsPage(config, address, page);
    if (data.length === 0) return { items };

    for (const tx of data) {
      if (tx.block_height < minHeight) continue;
      if (isNativeTransfer(tx)) items.push(...toApiOperations(tx, accountHash));
    }

    if (page >= page_count) return { items };
    // Ordered by deploy timestamp, so heights are only near-descending: a whole page has to fall
    // below `minHeight` before the rest of the feed can be written off. That the feed is
    // newest-first at all is the indexer's behaviour, not a guarantee we can request — its
    // `order_by` / `order_direction` params are accepted and ignored — so an integration test
    // asserts it daily against mainnet.
    if (data.every(tx => tx.block_height < minHeight)) return { items };
  }
}

export function mapTxToOps(
  accountId: string,
  accountHash: string,
  fees = getEstimatedFees(),
): (tx: ITxnHistoryData) => CasperOperation[] {
  return (tx: ITxnHistoryData): CasperOperation[] => {
    if (!isNativeTransfer(tx)) return [];

    const parties = resolveParties(tx);
    if (!parties) return [];

    const { fromAccount, toAccount } = parties;
    const { timestamp, deploy_hash, error_message } = tx;
    const date = new Date(timestamp);
    const value = new BigNumber(tx.args.amount.parsed);
    const transferId = getTransferId(tx);

    const buildOperation = (type: "OUT" | "IN"): CasperOperation => ({
      id: encodeOperationId(accountId, deploy_hash, type),
      hash: deploy_hash,
      type,
      value: type === "OUT" ? value.plus(fees) : value,
      fee: fees,
      blockHeight: 1,
      blockHash: null,
      hasFailed: Boolean(error_message),
      accountId,
      senders: [fromAccount],
      recipients: [toAccount],
      date,
      extra: { ...(transferId !== undefined && { transferId }) },
    });

    const ops: CasperOperation[] = [];
    if (accountHash === fromAccount) ops.push(buildOperation("OUT"));
    if (accountHash === toAccount) ops.push(buildOperation("IN"));
    return ops;
  };
}
