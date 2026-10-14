import { writeVarInt } from "@ledgerhq/wallet-btc/utils";
import type { CraftedTransaction, FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { Explorer } from "../network/explorer";
import { getTxHex } from "./txHex";
import { inputSequence, signingRules } from "./currency";
import { isReplaceable } from "./replacement";
import { derivationModeOf, feeInputs, resolveIntent, shapeOf, type BitcoinIntent } from "./intent";
import type { ShapeOutput } from "./shape";
import { BITCOIN_SIGNING_ENVELOPE_VERSION, type BitcoinSigningEnvelope } from "./types";

const TWO_POW_32 = 0x100000000n;

/**
 * Serializes the outputs as the device expects them (varint count, then value, script length and
 * script for each); Decred outputs carry two extra varints.
 */
export function serializeOutputs(outputs: ShapeOutput[], isDecred: boolean): string {
  let length = outputs.reduce((sum, output) => sum + 8 + output.script.length + 1, 1);
  if (isDecred) length += 2 * outputs.length;
  const buffer = Buffer.allocUnsafe(length);
  let offset = writeVarInt(buffer, outputs.length, 0);
  for (const output of outputs) {
    buffer.writeUInt32LE(Number(output.value % TWO_POW_32), offset);
    buffer.writeUInt32LE(Number(output.value / TWO_POW_32), offset + 4);
    offset += 8;
    if (isDecred) {
      offset = writeVarInt(buffer, 0, offset);
      offset = writeVarInt(buffer, 0, offset);
    }
    offset = writeVarInt(buffer, output.script.length, offset);
    offset += output.script.copy(buffer, offset);
  }
  return buffer.toString("hex");
}

export type CraftedDetails = {
  /** Outpoints spent, "txid-index" — the form `Operation.extra.inputs` uses. */
  inputs: string[];
  inputRefs: Array<{ hash: string; outputIndex: number; address: string }>;
  fee: bigint;
  amount: bigint;
  senders: string[];
  recipients: string[];
  /** Signals BIP125 replaceability. */
  replaceable: boolean;
};

/** Lays out the transaction and returns the device signing request (see {@link BitcoinSigningEnvelope}). */
export async function craftTransaction(
  explorer: Explorer,
  currencyId: string,
  intent: BitcoinIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const resolved = await resolveIntent(
    explorer,
    currencyId,
    intent,
    feeInputs(intent, customFees?.parameters),
  );
  const shape = shapeOf(currencyId, intent, resolved);
  const { data } = resolved;

  const prevTxIds = [...new Set(shape.inputs.map(i => i.txid))];
  const [prevTxHexes, tip] = await Promise.all([
    Promise.all(prevTxIds.map(txid => getTxHex(explorer, txid))),
    explorer.getCurrentBlock(),
  ]);
  const hexById = new Map(prevTxIds.map((txid, i) => [txid, prevTxHexes[i]]));

  const rules = signingRules(currencyId, derivationModeOf(data), intent.recipient);
  const sequence = inputSequence(currencyId);
  const lastOutput = shape.outputs[shape.outputs.length - 1];

  const envelope: BitcoinSigningEnvelope = {
    version: BITCOIN_SIGNING_ENVELOPE_VERSION,
    currency: currencyId,
    inputs: shape.inputs.map(input => ({
      prevTxHex: hexById.get(input.txid) as string,
      txid: input.txid,
      outputIndex: input.vout,
      sequence,
      path: input.path,
      blockHeight: input.blockHeight,
    })),
    outputs: shape.outputs.map(o => ({
      script: o.script.toString("hex"),
      value: o.value.toString(),
      address: o.address,
      isChange: o.isChange,
    })),
    outputScriptHex: serializeOutputs(shape.outputs, rules.additionals.includes("decred")),
    ...(lastOutput?.isChange && data.change ? { changePath: data.change.path } : {}),
    ...(rules.lockTime === undefined ? {} : { lockTime: rules.lockTime }),
    sigHashType: rules.sigHashType,
    segwit: rules.segwit,
    additionals: rules.additionals,
    ...(rules.expiryHeight === undefined ? {} : { expiryHeight: rules.expiryHeight }),
    hasExtraData: rules.hasExtraData,
    blockHeight: tip.height,
  };

  const details: CraftedDetails = {
    inputs: shape.inputs.map(i => `${i.txid}-${i.vout}`),
    inputRefs: shape.inputs.map(i => ({ hash: i.txid, outputIndex: i.vout, address: i.address })),
    fee: shape.fee,
    amount: shape.amount,
    senders: [...new Set(shape.inputs.map(i => i.address))],
    recipients: shape.outputs
      .filter(o => !o.isChange && o.address !== null)
      .map(o => o.address as string),
    replaceable: isReplaceable(envelope),
  };

  return { transaction: JSON.stringify(envelope), details };
}

export function parseEnvelope(transaction: string): BitcoinSigningEnvelope {
  const envelope = JSON.parse(transaction) as BitcoinSigningEnvelope;
  if (envelope?.version !== BITCOIN_SIGNING_ENVELOPE_VERSION) {
    throw new Error(`Unsupported bitcoin signing envelope version ${String(envelope?.version)}`);
  }
  return envelope;
}
