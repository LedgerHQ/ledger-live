import { promiseAllBatched } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ApiResponseTransaction } from "../../types";
import { getAllTransactions } from "./getAllTransactions";

const FETCH_CONCURRENCY = 5;

export type KaspaTransfer = {
  id: string;
  type: "IN" | "OUT";
  /** Net movement from the account's perspective — absolute value of (myOutputs − myInputs).
   *  For OUT this equals amount_sent + fee; for IN it equals amount_received. */
  netMovement: BigNumber;
  fee: BigNumber;
  senders: string[];
  recipients: string[];
  blockHeight: number;
  blockHash: string;
  date: Date;
};

/**
 * Parse a Kaspa indexer transaction into a convention-neutral transfer record from the
 * perspective of `addressSet`. Returns raw net movement and fee without applying any
 * value convention — callers decide how to interpret them:
 *   - Legacy bridge (scanOperations): value = netMovement  (OUT includes fee)
 *   - Alpaca API (listOperations):    value = type === "OUT" ? netMovement − fee : netMovement
 *
 * Null guards on inputs cover indexer responses where `previous_outpoint_address` or
 * `previous_outpoint_amount` is missing (coinbase-like or unresolved inputs).
 */
export function parseKaspaTransfer(
  tx: ApiResponseTransaction,
  addressSet: Set<string>,
): KaspaTransfer {
  const inputs = tx.inputs ?? [];
  const outputs = tx.outputs ?? [];

  const myInputAmount = inputs.reduce((acc: BigNumber, v): BigNumber => {
    if (v.previous_outpoint_address !== null && addressSet.has(v.previous_outpoint_address)) {
      return acc.plus(BigNumber(v.previous_outpoint_amount ?? 0));
    }
    return acc;
  }, BigNumber(0));

  const myOutputAmount = outputs.reduce((acc: BigNumber, v) => {
    if (addressSet.has(v.script_public_key_address)) {
      return acc.plus(BigNumber(v.amount));
    }
    return acc;
  }, BigNumber(0));

  const totalInputAmount = inputs.reduce(
    (acc: BigNumber, v) => acc.plus(BigNumber(v.previous_outpoint_amount ?? 0)),
    BigNumber(0),
  );
  const totalOutputAmount = outputs.reduce(
    (acc: BigNumber, v) => acc.plus(BigNumber(v.amount)),
    BigNumber(0),
  );

  const type: "IN" | "OUT" = myOutputAmount.gt(myInputAmount) ? "IN" : "OUT";

  return {
    id: tx.transaction_id,
    type,
    netMovement: myOutputAmount.minus(myInputAmount).absoluteValue(),
    fee:
      inputs.length > 0
        ? BigNumber.maximum(0, totalInputAmount.minus(totalOutputAmount))
        : BigNumber(0),
    senders: inputs
      .filter(inp => inp.previous_outpoint_address !== null)
      .map(inp => inp.previous_outpoint_address),
    recipients: outputs.map(output => output.script_public_key_address),
    blockHeight: tx.accepting_block_blue_score,
    blockHash: tx.block_hash[0] ?? "",
    date: new Date(tx.block_time),
  };
}

/**
 * Map a Kaspa indexer transaction into a legacy (`@ledgerhq/types-live`) Operation.
 * Applies the legacy value convention: OUT value = netMovement (amount + fee).
 * Shared with `scanOperations` (bridge) — Alpaca consumers use `parseKaspaTransfer` directly.
 */
export function transactionToOperation(
  tx: ApiResponseTransaction,
  addressSet: Set<string>,
  accountId: string,
): Operation {
  const t = parseKaspaTransfer(tx, addressSet);
  return {
    id: t.id,
    hash: t.id,
    type: t.type,
    value: t.netMovement,
    fee: t.fee,
    senders: t.senders,
    recipients: t.recipients,
    blockHeight: t.blockHeight,
    blockHash: t.blockHash,
    accountId,
    date: t.date,
    extra: {},
  } as Operation;
}

export async function scanOperations(
  addresses: string[],
  accountId: string,
  afterValue: number = 1,
): Promise<Operation[]> {
  const operations: Operation[] = [];

  const addressSet = new Set(addresses);

  const fetchedTxs = (
    await promiseAllBatched(FETCH_CONCURRENCY, addresses, addr =>
      getAllTransactions(addr, afterValue),
    )
  ).flat();

  for (const tx of fetchedTxs) {
    operations.push(transactionToOperation(tx, addressSet, accountId));
  }

  return operations;
}
