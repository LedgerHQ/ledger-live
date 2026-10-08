import { ledger_trade } from "./generate-protocol";
import { base64UrlDecode, isHexadecimal } from "./shared-utils";
import { SwapPayloadFieldExceedsLimit } from "./errors";

/** @ignore internal */
export type SwapProtobufPayload = {
  payinAddress: string;
  payinExtraId?: string;
  refundAddress: string;
  refundExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  currencyFrom: string;
  currencyTo: string;
  amountToProvider: Buffer;
  amountToWallet: Buffer;
  message?: string;
  deviceTransactionId?: string;
  deviceTransactionIdNg?: Buffer;
};

export type SwapPayload = {
  payinAddress: string;
  payinExtraId?: string;
  refundAddress: string;
  refundExtraId?: string;
  payoutAddress: string;
  payoutExtraId?: string;
  currencyFrom: string;
  currencyTo: string;
  amountToProvider: bigint;
  amountToWallet: bigint;
  message?: string;
  deviceTransactionId?: string;
  deviceTransactionIdNg?: string;
};

/**
 * deprecated use `decodeSwapPayload` instead
 */
export const decodePayloadProtobuf = (payload: string): Promise<SwapPayload> =>
  decodeSwapPayload(payload);

/** @ignore internal */
export function decodeNewTransactionResponseBytes(bytes: Uint8Array): SwapProtobufPayload {
  // `decode` throws on malformed wire bytes, which is the validation we want here.
  // (protobufjs `verify` only checks a plain message object, not an encoded buffer.)
  return ledger_trade.NewTransactionResponse.decode(bytes) as unknown as SwapProtobufPayload;
}

function decodeNewTransactionResponse(payload: string): SwapProtobufPayload {
  // Swap NG payloads are base64url and can reach us in JWS form with a leading "."
  // separator; normalize both so we decode exactly the bytes the device receives.
  const normalized = payload.startsWith(".") ? payload.slice(1) : payload;
  const buffer = isHexadecimal(normalized)
    ? Buffer.from(normalized, "hex")
    : base64UrlDecode(normalized);
  return decodeNewTransactionResponseBytes(buffer);
}

export async function decodeSwapPayload(payload: string): Promise<SwapPayload> {
  return toSwapPayload(decodeNewTransactionResponse(payload));
}

/** @ignore internal */
export function toSwapPayload(decodePayload: SwapProtobufPayload): SwapPayload {
  const {
    amountToWallet: amountToWalletBuffer,
    amountToProvider: amountToProviderBuffer,
    deviceTransactionIdNg: deviceTransactionIdNgBuffer,
  } = decodePayload;
  const amountToWalletHexString = Buffer.from(amountToWalletBuffer).toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToWallet = BigInt("0x" + amountToWalletHexString); // Convert hexadecimal representation to a big integer

  const amountToProviderHexString = Buffer.from(amountToProviderBuffer).toString("hex"); // Gets the hexadecimal representation from the Buffer
  const amountToProvider = BigInt("0x" + amountToProviderHexString); // Convert hexadecimal representation to a big integer

  // Normalize with Buffer.from: protobufjs may hand back a plain Uint8Array (browser/RN)
  // whose toString("hex") would not produce hex, unlike the amount buffers above.
  const deviceTransactionIdNg = deviceTransactionIdNgBuffer
    ? Buffer.from(deviceTransactionIdNgBuffer).toString("hex") || undefined
    : undefined;

  return { ...decodePayload, amountToWallet, amountToProvider, deviceTransactionIdNg };
}

type ProtoFieldKind = "string" | "bytes";

type ProtoFieldLimit<T> = {
  key: keyof T;
  protoName: string;
  kind: ProtoFieldKind;
  maxSize: number;
};

/**
 * Field size limits enforced by the Exchange device app for a swap
 * `NewTransactionResponse`, mirrored from app-exchange `src/proto/protocol.options`.
 * These are what the device rejects with a generic DESERIALIZATION_FAILED (0x6a81).
 *
 * @ignore internal lookup table, consumers should use `findSwapPayloadSpecViolation`.
 */
const NEW_TRANSACTION_RESPONSE_FIELD_LIMITS: ProtoFieldLimit<SwapProtobufPayload>[] = [
  { key: "payinAddress", protoName: "payin_address", kind: "string", maxSize: 151 },
  { key: "payinExtraId", protoName: "payin_extra_id", kind: "string", maxSize: 20 },
  { key: "refundAddress", protoName: "refund_address", kind: "string", maxSize: 151 },
  { key: "refundExtraId", protoName: "refund_extra_id", kind: "string", maxSize: 20 },
  { key: "payoutAddress", protoName: "payout_address", kind: "string", maxSize: 151 },
  { key: "payoutExtraId", protoName: "payout_extra_id", kind: "string", maxSize: 20 },
  { key: "currencyFrom", protoName: "currency_from", kind: "string", maxSize: 10 },
  { key: "currencyTo", protoName: "currency_to", kind: "string", maxSize: 10 },
  { key: "amountToProvider", protoName: "amount_to_provider", kind: "bytes", maxSize: 16 },
  { key: "amountToWallet", protoName: "amount_to_wallet", kind: "bytes", maxSize: 16 },
  { key: "deviceTransactionId", protoName: "device_transaction_id", kind: "string", maxSize: 11 },
  {
    key: "deviceTransactionIdNg",
    protoName: "device_transaction_id_ng",
    kind: "bytes",
    maxSize: 32,
  },
];

type SellFieldLimitView = ledger_trade.INewSellResponse & {
  outAmountCoefficient?: Uint8Array | null;
};

// Mirrored from app-exchange `src/proto/protocol.options`.
const NEW_SELL_RESPONSE_FIELD_LIMITS: ProtoFieldLimit<SellFieldLimitView>[] = [
  { key: "traderEmail", protoName: "trader_email", kind: "string", maxSize: 50 },
  { key: "inCurrency", protoName: "in_currency", kind: "string", maxSize: 10 },
  { key: "inAmount", protoName: "in_amount", kind: "bytes", maxSize: 16 },
  { key: "inAddress", protoName: "in_address", kind: "string", maxSize: 151 },
  { key: "inExtraId", protoName: "in_extra_id", kind: "string", maxSize: 20 },
  { key: "outCurrency", protoName: "out_currency", kind: "string", maxSize: 10 },
  {
    key: "outAmountCoefficient",
    protoName: "out_amount.coefficient",
    kind: "bytes",
    maxSize: 16,
  },
  { key: "deviceTransactionId", protoName: "device_transaction_id", kind: "bytes", maxSize: 32 },
];

/** @ignore internal */
export function measureBytes(value: unknown): number {
  if (typeof value === "string") return Buffer.byteLength(value, "utf8");
  if (value instanceof Uint8Array) return value.length;
  return 0;
}

/**
 * Decodes a raw swap payload (hex or base64) and returns the first field that
 * exceeds the Exchange device app's protobuf size limits as a precise
 * `SwapPayloadFieldExceedsLimit`, or `undefined` when everything fits (or the
 * payload cannot be decoded locally).
 *
 * This is meant to *enrich* the device's opaque DESERIALIZATION_FAILED (0x6a81)
 * with an actionable reason (e.g. an oversized `payin_extra_id`) — it must never
 * gate the flow. The device stays the source of truth, so if these (hardcoded)
 * limits ever drift from the app we simply return `undefined` and keep the
 * device's own error.
 *
 * nanopb reserves one byte for the NUL terminator on `string` fields, so their
 * usable content limit is `max_size - 1`; `bytes` fields use the full `max_size`.
 */
export function findSwapPayloadSpecViolation(
  payload: string,
): SwapPayloadFieldExceedsLimit | undefined {
  let decoded: SwapProtobufPayload;
  try {
    decoded = decodeNewTransactionResponse(payload);
  } catch {
    return undefined;
  }

  const [violation] = findSwapFieldLimitViolations(decoded);
  return violation
    ? new SwapPayloadFieldExceedsLimit(violation.field, violation.limit, violation.actual)
    : undefined;
}

/** @ignore internal */
export type FieldLimitViolation = { field: string; limit: number; actual: number };

/** @ignore internal */
export function findSwapFieldLimitViolations(decoded: SwapProtobufPayload): FieldLimitViolation[] {
  return findLimitViolations(decoded, NEW_TRANSACTION_RESPONSE_FIELD_LIMITS);
}

/** @ignore internal */
export function findSellFieldLimitViolations(
  decoded: ledger_trade.INewSellResponse,
): FieldLimitViolation[] {
  return findLimitViolations(
    { ...decoded, outAmountCoefficient: decoded.outAmount?.coefficient },
    NEW_SELL_RESPONSE_FIELD_LIMITS,
  );
}

function findLimitViolations<T>(decoded: T, limits: ProtoFieldLimit<T>[]): FieldLimitViolation[] {
  const violations: FieldLimitViolation[] = [];
  for (const { key, protoName, kind, maxSize } of limits) {
    const actualBytes = measureBytes(decoded[key]);
    const maxBytes = kind === "string" ? maxSize - 1 : maxSize;

    if (actualBytes > maxBytes) {
      violations.push({ field: protoName, limit: maxBytes, actual: actualBytes });
    }
  }
  return violations;
}
