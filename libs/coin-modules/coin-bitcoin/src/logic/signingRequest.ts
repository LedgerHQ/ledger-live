import { Psbt, Transaction } from "bitcoinjs-lib";
import { coinTraits } from "./coinTraits";
import { getNetworkParameters } from "../networks";
import { DerivationModes, derivationModeOf } from "./selectUtxos";

/**
 * Whether the currency's transactions are crafted as a PSBT (Bitcoin serialization, read and
 * written by bitcoinjs-lib) or as a {@link SigningRequest} for the device to build.
 *
 * Read from the currency's traits: the formats carrying an expiry height (Komodo's
 * Overwinter/Sapling transactions, Decred's) are not Bitcoin serialization, so the Ledger app
 * builds them from a signing request, as the bridge has it build every transaction.
 */
export function craftsSigningRequest(currencyId: string): boolean {
  return coinTraits[currencyId]?.hasExpiryHeight === true;
}

/**
 * Everything a Ledger bitcoin-family app needs to build and sign a transaction with its
 * trusted-input flow (hw-app-btc's `createPaymentTransaction`), the derivation paths excepted:
 * the signer knows them. Amounts are decimal strings.
 */
export type DeviceSigningParameters = {
  currencyId: string;
  inputs: {
    /** Id of the transaction that created the spent output. */
    txid: string;
    vout: number;
    value: string;
    /** That transaction, serialized (hex): the device verifies the spent amount from it. */
    prevTxHex: string;
    sequence: number;
  }[];
  /** The outputs as the device serializes them (`createPaymentTransaction`'s `outputScriptHex`). */
  outputScriptHex: string;
  /** Index of the change output, sent back to the account's address, if any. */
  changeOutputIndex?: number;
  lockTime?: number;
  /** Expiry height, hex (4 bytes), for the formats that carry one. */
  expiryHeight?: string;
  sigHashType: number;
  segwit: boolean;
  /** Format flags of the device protocol (hw-app-btc `additionals`). */
  additionals: string[];
  /** Whether previous transactions carry extra data (hw-app-btc `splitTransaction`). */
  hasExtraData: boolean;
};

/**
 * The transaction `craftTransaction` returns for the formats the device builds itself (Komodo,
 * Decred): the device parameters plus the outputs. Serialized as JSON.
 */
export type SigningRequest = {
  type: "bitcoin-signing-request";
  version: 1;
  outputs: { script: string; value: string }[];
} & DeviceSigningParameters;

export const SIGNING_REQUEST_TYPE: SigningRequest["type"] = "bitcoin-signing-request";

function varInt(value: number): Buffer {
  if (value < 0xfd) return Buffer.from([value]);
  if (value <= 0xffff) {
    const buffer = Buffer.alloc(3);
    buffer[0] = 0xfd;
    buffer.writeUInt16LE(value, 1);
    return buffer;
  }
  const buffer = Buffer.alloc(5);
  buffer[0] = 0xfe;
  buffer.writeUInt32LE(value, 1);
  return buffer;
}

/**
 * The outputs as the device serializes them: count, then for each output its 8-byte value, then
 * its script. Decred inserts a 2-byte script version (0) before the script, as the bridge writes it
 * (`buildAndSign.ts`).
 */
export function serializeOutputs(
  outputs: { script: Buffer; value: bigint }[],
  additionals: string[],
): string {
  const decred = additionals.includes("decred");
  const parts: Buffer[] = [varInt(outputs.length)];
  for (const { script, value } of outputs) {
    const amount = Buffer.alloc(8);
    amount.writeBigUInt64LE(value);
    parts.push(amount);
    if (decred) parts.push(varInt(0), varInt(0));
    parts.push(varInt(script.length), script);
  }
  return Buffer.concat(parts).toString("hex");
}

/**
 * The device-protocol parameters of a currency, as the bridge derives them (`signOperation.ts`):
 * the currency id and its format flags, the address format, the expiry height, the extra-data flag,
 * the sighash type and, for Komodo, the interest locktime.
 */
export function deviceParameters(
  currencyId: string,
  derivationMode: DerivationModes,
  recipient: string,
  now: Date,
): Pick<
  DeviceSigningParameters,
  "additionals" | "hasExtraData" | "sigHashType" | "segwit" | "lockTime" | "expiryHeight"
> {
  const traits = coinTraits[currencyId];
  const additionals = [currencyId];
  if (derivationMode === DerivationModes.NATIVE_SEGWIT) additionals.push("bech32");
  if (derivationMode === DerivationModes.TAPROOT) additionals.push("bech32m");
  if (traits?.additionals) additionals.push(...traits.additionals(recipient));
  return {
    additionals,
    hasExtraData: traits?.hasExtraData === true,
    sigHashType: getNetworkParameters(currencyId).sigHash,
    segwit: derivationMode !== DerivationModes.LEGACY,
    ...(traits?.hasExpiryHeight ? { expiryHeight: "00000000" } : {}),
    ...(traits?.hasInterestLockTime ? { lockTime: Math.floor(now.getTime() / 1000) - 777 } : {}),
  };
}

const HEX_STRING = /^(?:[0-9a-fA-F]{2})*$/;
const AMOUNT = /^\d+$/;

const isHex = (value: unknown): value is string =>
  typeof value === "string" && HEX_STRING.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAmount = (value: unknown): boolean => typeof value === "string" && AMOUNT.test(value);

/** Whether `value` has the shape of a {@link SigningRequest}, as a consumer may pass any JSON back. */
function isSigningRequest(value: unknown): value is SigningRequest {
  if (!isRecord(value)) return false;
  const { inputs, outputs, additionals } = value;
  return (
    value.type === SIGNING_REQUEST_TYPE &&
    value.version === 1 &&
    typeof value.currencyId === "string" &&
    Array.isArray(inputs) &&
    inputs.every(
      (input: unknown) =>
        isRecord(input) &&
        isHex(input.txid) &&
        Number.isInteger(input.vout) &&
        isAmount(input.value) &&
        isHex(input.prevTxHex) &&
        Number.isInteger(input.sequence),
    ) &&
    Array.isArray(outputs) &&
    outputs.length > 0 &&
    outputs.every(
      (output: unknown) => isRecord(output) && isHex(output.script) && isAmount(output.value),
    ) &&
    isHex(value.outputScriptHex) &&
    typeof value.sigHashType === "number" &&
    typeof value.segwit === "boolean" &&
    Array.isArray(additionals) &&
    additionals.every((flag: unknown) => typeof flag === "string") &&
    typeof value.hasExtraData === "boolean"
  );
}

/** The outputs of a signing request as the device serializes them, from its `outputs`. */
export function requestOutputScript(request: SigningRequest): Buffer {
  return Buffer.from(
    serializeOutputs(
      request.outputs.map(output => ({
        script: Buffer.from(output.script, "hex"),
        value: BigInt(output.value),
      })),
      request.additionals,
    ),
    "hex",
  );
}

/**
 * The signing request a crafted transaction carries, or `undefined` for a PSBT. A request that is
 * malformed, or whose `outputScriptHex` does not serialize its `outputs`, is refused.
 */
export function parseSigningRequest(tx: string): SigningRequest | undefined {
  if (!tx.startsWith("{")) return undefined;
  const parsed: unknown = JSON.parse(tx);
  if (!isRecord(parsed) || parsed.type !== SIGNING_REQUEST_TYPE) {
    throw new Error("unknown crafted transaction format");
  }
  if (!isSigningRequest(parsed)) throw new Error("malformed signing request");
  if (requestOutputScript(parsed).toString("hex") !== parsed.outputScriptHex.toLowerCase()) {
    throw new Error("the signing request's outputScriptHex does not serialize its outputs");
  }
  return parsed;
}

/** Id (hex, display order) of the transaction an input spends from. */
const inputTxid = (hash: Buffer) => Buffer.from(hash).reverse().toString("hex");

/**
 * The device parameters of a PSBT crafted by `craftTransaction`. Every input must carry its
 * previous transaction (`nonWitnessUtxo`), which the device's trusted-input flow verifies.
 */
function psbtSigningParameters(
  currencyId: string,
  psbtBase64: string,
  { recipient, now = new Date() }: { recipient?: string | undefined; now?: Date | undefined },
): DeviceSigningParameters {
  const psbt = Psbt.fromBase64(psbtBase64);
  const previousOutputs = psbt.txInputs.map((input, index) => {
    const previousTx = psbt.data.inputs[index].nonWitnessUtxo;
    if (!previousTx) {
      throw new Error(`input ${index} does not carry its previous transaction`);
    }
    const output = Transaction.fromBuffer(previousTx).outs[input.index];
    if (!output) throw new Error(`input ${index} spends an output its transaction does not have`);
    return { previousTx, output };
  });
  if (previousOutputs.length === 0) throw new Error("the transaction has no input");

  const senderScript = previousOutputs[0].output.script;
  const derivationMode = derivationModeOf(senderScript);
  const outputs = psbt.txOutputs.map(output => ({
    script: output.script,
    value: BigInt(output.value),
  }));
  const changeOutputIndex = outputs.findIndex(
    (output, index) => index > 0 && output.script.equals(senderScript),
  );
  // Some device flags depend on the recipient's format (Bitcoin Cash's `cashaddr`): the caller's
  // recipient, or the one Ledger Wallet would show.
  const shownRecipient =
    recipient ??
    coinTraits[currencyId]?.displayedRecipient?.(outputs[0]?.script ?? Buffer.alloc(0)) ??
    "";
  const parameters = deviceParameters(currencyId, derivationMode, shownRecipient, now);
  return {
    currencyId,
    inputs: psbt.txInputs.map((input, index) => ({
      txid: inputTxid(input.hash),
      vout: input.index,
      value: String(previousOutputs[index].output.value),
      prevTxHex: previousOutputs[index].previousTx.toString("hex"),
      sequence: input.sequence ?? 0xffffffff,
    })),
    outputScriptHex: serializeOutputs(outputs, parameters.additionals),
    ...(changeOutputIndex > 0 ? { changeOutputIndex } : {}),
    ...parameters,
    ...(psbt.locktime ? { lockTime: psbt.locktime } : {}),
  };
}

/**
 * What a Ledger bitcoin-family app needs to build and sign the transaction `craftTransaction`
 * returned, through hw-app-btc's `createPaymentTransaction` (the derivation paths excepted). Every
 * app but app-bitcoin-new signs only this way, whatever the format: a PSBT for Bitcoin
 * serialization, a signing request for the formats the device builds itself.
 *
 * `options.recipient` is the recipient as the user entered it: some device flags depend on its
 * format (Bitcoin Cash's `cashaddr`, which makes the device show a cashaddr address). Without it,
 * the format Ledger Wallet shows is assumed.
 */
export function deviceSigningParameters(
  currencyId: string,
  tx: string,
  options: { recipient?: string; now?: Date } = {},
): DeviceSigningParameters {
  const request = parseSigningRequest(tx);
  if (request) {
    const { type: _type, version: _version, outputs: _outputs, ...parameters } = request;
    return parameters;
  }
  return psbtSigningParameters(currencyId, tx, options);
}
