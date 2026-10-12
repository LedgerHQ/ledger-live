import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { OperationType } from "@ledgerhq/types-live";
import type { BitcoinTxDetails, BitcoinTxDetailsInput } from "@ledgerhq/coin-bitcoin/api";
import type { BtcOperation } from "../types";

/** Bitcoin Cash addresses are shown as cashaddr without their "bitcoincash:" prefix. */
export const bchToCashaddrAddressWithoutPrefix = (address: string): string =>
  address ? address.substring(address.indexOf(":") + 1) : address;

export const displayAddress = (currencyId: string, address: string): string =>
  currencyId === "bitcoin_cash" ? bchToCashaddrAddressWithoutPrefix(address) : address;

/**
 * The transaction sequence number of the account's inputs: the minimum nSequence, an absent one
 * counted as 0xfffffffe (Bitcoin Core's default). `undefined` when the account spends nothing.
 */
export function inferTransactionSequenceNumberFromInputs(
  accountInputs: Array<Pick<BitcoinTxDetailsInput, "sequence">>,
): number | undefined {
  if (accountInputs.length === 0) return undefined;
  return Math.min(...accountInputs.map(input => input.sequence ?? 0xfffffffe));
}

/**
 * Interprets one transaction against every address of the account (ported from coin-bitcoin's
 * `mapTxToOperations`): an OUT when the account spends — net of the change it gets back — and an
 * IN when it receives on an address that is not change.
 */
export function txToOperations(
  tx: BitcoinTxDetails,
  currencyId: string,
  accountId: string,
  accountAddresses: ReadonlySet<string>,
  changeAddresses: ReadonlySet<string>,
): BtcOperation[] {
  const operations: BtcOperation[] = [];
  const fee = new BigNumber(tx.fees);
  const blockHeight = tx.block?.height;
  const blockHash = tx.block?.hash;
  const date = new Date(tx.block?.time ?? tx.receivedAt);
  const senders = new Set<string>();
  const recipients: string[] = [];
  let value = new BigNumber(0);
  const accountInputs: BitcoinTxDetailsInput[] = [];
  const accountOutputs: typeof tx.outputs = [];
  const inputs = new Set<string>();
  const show = (address: string) => displayAddress(currencyId, address);

  for (const input of tx.inputs) {
    if (input.txid) inputs.add(`${input.txid}-${input.vout}`);
    if (input.address) {
      senders.add(show(input.address));
      if (input.value && accountAddresses.has(input.address)) {
        value = value.plus(input.value);
        accountInputs.push(input);
      }
    }
  }

  const transactionSequenceNumber = new BigNumber(
    inferTransactionSequenceNumberFromInputs(accountInputs) || 0,
  );
  const hasSpentNothing = value.eq(0);

  // Change output is always the last one
  const changeOutputIndex =
    tx.outputs.length === 0 ? 0 : tx.outputs.map(o => o.index).reduce((p, c) => (p > c ? p : c));

  for (const output of tx.outputs) {
    // the explorer reports "unknown" for OP_RETURN outputs, which is not an address
    if (!output.address || output.address.includes("unknown")) continue;
    if (!accountAddresses.has(output.address)) {
      if (
        accountInputs.length > 0 &&
        (tx.outputs.length === 1 || output.index < changeOutputIndex)
      ) {
        recipients.push(show(output.address));
      }
    } else {
      accountOutputs.push(output);
      if (!changeAddresses.has(output.address)) {
        recipients.push(show(output.address));
      } else if (
        (recipients.length === 0 && output.index >= changeOutputIndex) ||
        hasSpentNothing
      ) {
        recipients.push(show(output.address));
      }
    }
  }

  const common = {
    hash: tx.id,
    fee,
    senders: Array.from(senders),
    recipients,
    blockHeight,
    blockHash,
    transactionSequenceNumber,
    accountId,
    date,
    hasFailed: false,
    extra: { inputs: Array.from(inputs) },
  };

  if (accountInputs.length > 0) {
    for (const output of accountOutputs) {
      if (changeAddresses.has(output.address as string)) {
        value = value.minus(output.value);
      }
    }
    const type: OperationType = "OUT";
    operations.push({ ...common, id: encodeOperationId(accountId, tx.id, type), type, value });
  }

  if (accountOutputs.length > 0) {
    const filterChangeAddresses = accountInputs.length > 0;
    let received = new BigNumber(0);
    let receivedCount = 0;
    for (const output of accountOutputs) {
      if (!filterChangeAddresses || !changeAddresses.has(output.address as string)) {
        received = received.plus(output.value);
        receivedCount += 1;
      }
    }
    if (receivedCount > 0) {
      const type: OperationType = "IN";
      operations.push({
        ...common,
        id: encodeOperationId(accountId, tx.id, type),
        type,
        value: received,
      });
    }
  }

  return operations;
}
