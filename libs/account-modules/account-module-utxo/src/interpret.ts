import type { AccountOperation } from "@ledgerhq/account-module-framework";
import type { UtxoTransaction, UtxoTransactionInput, UtxoTransactionOutput } from "./types";

/** `AccountOperation.details` of a UTXO account. */
export type UtxoOperationDetails = {
  /** Every outpoint the transaction spends, "txid-vout". */
  inputs: string[];
  /** Lowest sequence of the inputs the account spends, on chains whose inputs carry one. */
  sequence?: number;
  replaceable: boolean;
};

export const outpointOf = (txid: string, vout: number): string => `${txid}-${vout}`;

export const inputsOf = (op: AccountOperation): string[] =>
  (op.details as Partial<UtxoOperationDetails> | undefined)?.inputs ?? [];

function lowestSequence(inputs: UtxoTransactionInput[]): number | undefined {
  const sequences = inputs.flatMap(input => (input.sequence === undefined ? [] : [input.sequence]));
  return sequences.length > 0 ? Math.min(...sequences) : undefined;
}

/**
 * Interprets one transaction against every address of the account: an OUT when the account
 * spends, net of the change it gets back, and an IN when it receives on an address that is not
 * change. Wallets put the change last, so outputs after the last foreign one are change.
 */
export function txToOperations(
  tx: UtxoTransaction,
  own: ReadonlySet<string>,
  change: ReadonlySet<string>,
  display: (address: string) => string,
): AccountOperation[] {
  const accountInputs = tx.inputs.filter(input => input.address && own.has(input.address));
  const accountOutputs = tx.outputs.filter(output => output.address && own.has(output.address));
  const spent = accountInputs.reduce((sum, input) => sum + BigInt(input.value), 0n);
  const spendsSomething = spent > 0n;
  const lastOutputIndex = tx.outputs.reduce((max, o) => Math.max(max, o.index), 0);

  const senders = [
    ...new Set(tx.inputs.flatMap(input => (input.address ? [display(input.address)] : []))),
  ];
  const recipients: string[] = [];
  for (const output of tx.outputs) {
    if (!output.address) continue;
    const isOwn = own.has(output.address);
    const isForeignPayment =
      !isOwn &&
      accountInputs.length > 0 &&
      (tx.outputs.length === 1 || output.index < lastOutputIndex);
    const isOwnPayment =
      isOwn &&
      (!change.has(output.address) ||
        (recipients.length === 0 && output.index >= lastOutputIndex) ||
        !spendsSomething);
    if (isForeignPayment || isOwnPayment) recipients.push(display(output.address));
  }

  const sequence = lowestSequence(accountInputs);
  const details: UtxoOperationDetails = {
    inputs: tx.inputs.flatMap(input => (input.txid ? [outpointOf(input.txid, input.vout)] : [])),
    ...(sequence === undefined ? {} : { sequence }),
    replaceable: tx.replaceable,
  };
  const date = new Date(tx.block?.time ?? tx.receivedAt);
  const common = {
    hash: tx.id,
    fee: BigInt(tx.fees),
    asset: { type: "native" } as const,
    senders,
    recipients,
    block: tx.block ? { ...tx.block, time: new Date(tx.block.time) } : null,
    date,
    failed: false,
    details,
  };

  const operations: AccountOperation[] = [];
  const isChange = (output: UtxoTransactionOutput) => change.has(output.address as string);
  if (accountInputs.length > 0) {
    const changeBack = accountOutputs.filter(isChange).reduce((s, o) => s + BigInt(o.value), 0n);
    operations.push({ ...common, id: `${tx.id}-OUT`, type: "OUT", value: spent - changeBack });
  }
  const received = accountOutputs.filter(output => accountInputs.length === 0 || !isChange(output));
  if (received.length > 0) {
    const value = received.reduce((sum, output) => sum + BigInt(output.value), 0n);
    operations.push({ ...common, id: `${tx.id}-IN`, type: "IN", value });
  }
  return operations;
}
