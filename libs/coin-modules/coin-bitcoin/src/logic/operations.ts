import type {
  Balance,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Explorer } from "../network/explorer";
import type { ExplorerTx } from "../network/types";
import { isReplaceable } from "./replacement";
import {
  BITCOIN_OPERATION_DETAILS_VERSION,
  type BitcoinOperationDetails,
  type BitcoinTxDetails,
  type BitcoinUtxoTransaction,
} from "./types";

/** Explorer page size; must exceed the number of transactions of one address in a single block. */

export function toTxDetails(tx: ExplorerTx): BitcoinTxDetails {
  return {
    id: tx.id,
    receivedAt: tx.received_at,
    block: tx.block ? { height: tx.block.height, hash: tx.block.hash, time: tx.block.time } : null,
    fees: String(tx.fees ?? 0),
    inputs: tx.inputs.map(input => ({
      ...(input.output_hash ? { txid: input.output_hash } : {}),
      vout: input.output_index,
      ...(input.address ? { address: input.address } : {}),
      value: String(input.value ?? 0),
      sequence: input.sequence,
    })),
    outputs: tx.outputs.map(output => ({
      index: output.output_index,
      ...(output.address ? { address: output.address } : {}),
      value: String(output.value ?? 0),
    })),
  };
}

const uniq = (values: Array<string | undefined>): string[] => [
  ...new Set(values.filter((v): v is string => !!v)),
];

/**
 * The impact of a transaction on one address. A UTXO transaction is account-wide, so this view is
 * partial by nature: whether an output is change or a self-send depends on the other addresses of
 * the account, which only a caller holding them can tell — hence the full transaction in `details`.
 */
export function toAddressOperation(details: BitcoinTxDetails, address: string): Operation {
  let spent = 0n;
  let received = 0n;
  let fundsEveryInput = details.inputs.length > 0;
  for (const input of details.inputs) {
    if (input.address === address) spent += BigInt(input.value);
    else fundsEveryInput = false;
  }
  for (const output of details.outputs) {
    if (output.address === address) received += BigInt(output.value);
  }

  const fees = BigInt(details.fees);
  const net = received - spent;
  const type = net >= 0n ? "IN" : "OUT";
  // The fee is the address's only when it funded the whole transaction.
  const paysFees = type === "OUT" && fundsEveryInput;
  const value = type === "IN" ? net : paysFees ? -net - fees : -net;
  const date = new Date(details.block?.time ?? details.receivedAt);

  const operationDetails: BitcoinOperationDetails = {
    version: BITCOIN_OPERATION_DETAILS_VERSION,
    pending: details.block === null,
    tx: details,
  };

  return {
    id: `${details.id}-${address}`,
    type,
    senders: uniq(details.inputs.map(i => i.address)),
    recipients: uniq(details.outputs.map(o => o.address)),
    value: value < 0n ? 0n : value,
    asset: { type: "native" },
    details: operationDetails,
    tx: {
      hash: details.id,
      // A mempool transaction has no block yet; `details.pending` says so explicitly.
      block: details.block
        ? {
            height: details.block.height,
            hash: details.block.hash,
            time: new Date(details.block.time),
          }
        : { height: 0, hash: "", time: date },
      fees,
      ...(paysFees ? { feesPayer: address } : {}),
      date,
      failed: false,
    },
  };
}

/**
 * Transactions of one address. The first page (no cursor) also carries the mempool ones; a
 * transaction both pending and confirmed is reported confirmed only.
 */
async function listAddressTxs(
  explorer: Explorer,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<ExplorerTx>> {
  const batchSize = options.limit ?? explorer.batchSize;
  const order = options.order === "desc" ? "descending" : "ascending";

  const [pendingTxs, page] = await Promise.all([
    options.cursor ? Promise.resolve([]) : explorer.getAddressPendingTxs(address, batchSize),
    explorer.getAddressTxs(address, {
      fromHeight: options.minHeight,
      batchSize,
      order,
      ...(options.cursor ? { token: options.cursor } : {}),
    }),
  ]);

  const confirmedIds = new Set(page.data.map(tx => tx.id));
  const pending = pendingTxs.filter(tx => !tx.block && !confirmedIds.has(tx.id));

  const next = page.token && page.token !== options.cursor ? page.token : undefined;
  return {
    items: order === "descending" ? [...pending, ...page.data] : [...page.data, ...pending],
    next,
  };
}

/** Operations of one address, paged as {@link listAddressTxs}. */
export async function listOperations(
  explorer: Explorer,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { items, next } = await listAddressTxs(explorer, address, options);
  return { items: items.map(tx => toAddressOperation(toTxDetails(tx), address)), next };
}

const COINBASE_PREVIOUS_TXID = "0".repeat(64);

/** The explorer names the script of an OP_RETURN or non-standard output "unknown". */
const knownAddress = (address: string | undefined): { address?: string } =>
  address && !address.includes("unknown") ? { address } : {};

/**
 * {@link toTxDetails} with its replaceability, keeping real addresses only; a coinbase input has
 * no previous transaction.
 */
export function toUtxoTransaction(tx: ExplorerTx): BitcoinUtxoTransaction {
  const details = toTxDetails(tx);
  return {
    ...details,
    replaceable: isReplaceable(details),
    inputs: details.inputs.map(({ txid, address, ...input }) => ({
      ...(txid && txid !== COINBASE_PREVIOUS_TXID ? { txid } : {}),
      ...input,
      ...knownAddress(address),
    })),
    outputs: details.outputs.map(({ address, ...output }) => ({
      ...output,
      ...knownAddress(address),
    })),
  };
}

/** Whole transactions of one address, paged as {@link listAddressTxs}. */
export async function listAddressTransactions(
  explorer: Explorer,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<BitcoinUtxoTransaction>> {
  const { items, next } = await listAddressTxs(explorer, address, options);
  return { items: items.map(toUtxoTransaction), next };
}

/** Every transaction of an address, mempool included, confirmed preferred. */
async function getAllAddressTxs(explorer: Explorer, address: string): Promise<BitcoinTxDetails[]> {
  const byId = new Map<string, BitcoinTxDetails>();
  let cursor: string | undefined;
  do {
    const page = await listOperations(explorer, address, {
      minHeight: 0,
      ...(cursor ? { cursor } : {}),
    });
    for (const op of page.items) {
      const { tx } = op.details as BitcoinOperationDetails;
      const known = byId.get(tx.id);
      if (!known || (!known.block && tx.block)) byId.set(tx.id, tx);
    }
    cursor = page.next;
  } while (cursor);
  return [...byId.values()];
}

/**
 * Balance of one address: its outputs no transaction of the address spends, mempool included.
 * There is no balance endpoint on the explorer, so this walks the whole history of the address.
 */
export async function getBalance(explorer: Explorer, address: string): Promise<Balance[]> {
  const txs = await getAllAddressTxs(explorer, address);
  const unspent = new Map<string, bigint>();
  for (const tx of txs) {
    for (const output of tx.outputs) {
      if (output.address === address) unspent.set(`${tx.id}:${output.index}`, BigInt(output.value));
    }
  }
  for (const tx of txs) {
    for (const input of tx.inputs) {
      if (input.txid) unspent.delete(`${input.txid}:${input.vout}`);
    }
  }
  let value = 0n;
  for (const v of unspent.values()) value += v;
  return [{ value, asset: { type: "native" } }];
}
