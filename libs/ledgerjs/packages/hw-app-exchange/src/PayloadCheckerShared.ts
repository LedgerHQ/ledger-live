import { base64UrlDecode } from "./shared-utils";
import { measureBytes, type FieldLimitViolation } from "./SwapUtils";
import {
  classifySwapNgSignature,
  isSupportedPartnerCurve,
  isValidSwapNgPartnerPublicKey,
  type SwapNgPartnerPublicKey,
} from "./SwapSignature";

/**
 * Stable issue codes reported by `checkSwapPayload` and `checkSellPayload`.
 */
export type SwapPayloadIssueCode =
  | "INVALID_ENCODING"
  | "PAYLOAD_LEADING_DOT"
  | "PROTOBUF_DECODE_FAILED"
  | "MISSING_FIELD"
  | "ZERO_AMOUNT"
  | "INVALID_DEVICE_TRANSACTION_ID"
  | "FIELD_EXCEEDS_LIMIT"
  | "PAYLOAD_TOO_LARGE"
  | "PAYLOAD_NEAR_SIZE_LIMIT"
  | "INVALID_PAYIN_EXTRA_DATA"
  | "EXTRA_ID_AND_EXTRA_DATA"
  | "PAYIN_EXTRA_DATA_NANO_S"
  | "EXPECTED_VALUE_MISMATCH"
  | "PUBLIC_KEY_MALFORMED"
  | "PUBLIC_KEY_COMPRESSED"
  | "SIGNATURE_MALFORMED"
  | "SIGNATURE_LEADING_ZERO"
  | "SIGNATURE_WITHOUT_DOT_PREFIX"
  | "SIGNATURE_OVER_RAW_PROTOBUF"
  | "SIGNATURE_INVALID"
  | "LEGACY_CURVE_UNSUPPORTED";

/**
 * A single problem found by `checkSwapPayload` or `checkSellPayload`.
 */
export type SwapPayloadIssue = {
  code: SwapPayloadIssueCode;
  severity: "error" | "warning";
  /** protobuf field name, e.g. "payin_extra_id" */
  field?: string;
  message: string;
};

/**
 * Result of `checkSwapPayload` and `checkSellPayload`.
 */
export type PayloadCheckReport<D> = {
  valid: boolean;
  decoded?: D;
  issues: SwapPayloadIssue[];
};

type Inspect<P, D> = (proto: P, wire: WireScan) => { decoded: D; issues: SwapPayloadIssue[] };

const createIssue =
  (severity: SwapPayloadIssue["severity"]) =>
  (code: SwapPayloadIssueCode, message: string, field?: string): SwapPayloadIssue => ({
    code,
    severity,
    ...(field ? { field } : {}),
    message,
  });

export const issueError = createIssue("error");
export const issueWarning = createIssue("warning");

const NG_NONCE_BYTES = 32;
const COMPRESSED_PUBLIC_KEY_BYTES = 33;
// Characters app-exchange src/base64.c decodes correctly, it garbles any other one ("+" included).
const NG_PAYLOAD_PATTERN = /^[A-Za-z0-9_/-]+={0,2}$/;

/** Decodes an NG payload like the Exchange app, `undefined` when it would reject or garble it. */
function decodeNgPayload(payload: string): Uint8Array | undefined {
  if (!NG_PAYLOAD_PATTERN.test(payload) || payload.length % 4 === 1) return undefined;
  return base64UrlDecode(payload);
}

type PayloadDecoding<P, D> = {
  messageName: string;
  wireFields: WireField[];
  decode: (bytes: Uint8Array) => P;
  inspect: Inspect<P, D>;
};

function inspectPayloadBytes<P, D>(
  bytes: Uint8Array,
  { messageName, wireFields, decode, inspect }: PayloadDecoding<P, D>,
): { decoded?: D; issues: SwapPayloadIssue[] } {
  let proto: P;
  try {
    proto = decode(bytes);
  } catch {
    return {
      issues: [
        issueError(
          "PROTOBUF_DECODE_FAILED",
          `The payload bytes are not a valid ledger_trade.${messageName} protobuf message.`,
        ),
      ],
    };
  }
  if (!proto) return { issues: [] };

  const issues: SwapPayloadIssue[] = [];
  const wire = scanWireFields(bytes, wireFields);
  if (!wire) {
    issues.push(
      issueError(
        "PROTOBUF_DECODE_FAILED",
        `The payload bytes are not a valid ledger_trade.${messageName} protobuf message for the Exchange app (nanopb): it rejects groups (wire types 3 and 4), a known field with an unexpected wire type and malformed wire data.`,
      ),
    );
  }
  try {
    const inspection = inspect(proto, wire ?? { occurrences: new Map(), violations: [] });
    return { decoded: inspection.decoded, issues: [...issues, ...inspection.issues] };
  } catch {
    return {
      issues: [
        ...issues,
        issueError(
          "PROTOBUF_DECODE_FAILED",
          `The payload decodes as a ledger_trade.${messageName} protobuf message but its fields could not be read.`,
        ),
      ],
    };
  }
}

function partnerPublicKeyIssues(partnerPublicKey: SwapNgPartnerPublicKey): SwapPayloadIssue[] {
  if (!isSupportedPartnerCurve(partnerPublicKey.curve)) {
    return [
      issueError(
        "PUBLIC_KEY_MALFORMED",
        `The partner public key curve "${String(partnerPublicKey.curve)}" is not supported: the Exchange app supports secp256k1 and secp256r1 only.`,
      ),
    ];
  }
  if (!isValidSwapNgPartnerPublicKey(partnerPublicKey)) {
    return [
      issueError(
        "PUBLIC_KEY_MALFORMED",
        `The partner public key is not a valid ${partnerPublicKey.curve} point. Provide the 65-byte uncompressed public key (0x04 prefix), the form registered with Ledger and sent to the Exchange app. A 33-byte compressed key is also accepted here, for verification only.`,
      ),
    ];
  }
  if (partnerPublicKey.data.length === COMPRESSED_PUBLIC_KEY_BYTES) {
    return [
      issueWarning(
        "PUBLIC_KEY_COMPRESSED",
        "The partner public key is the 33-byte compressed form. The signature is verified with it here, but the key registered with Ledger must be the 65-byte uncompressed form (0x04 prefix): the Exchange app only accepts an uncompressed partner key.",
      ),
    ];
  }
  return [];
}

/**
 * Runs every check shared by the payload checkers and collects all issues, in this order:
 * `formatIssues`, encoding, protobuf decoding, `scanWireFields` and `inspect`, `sizeIssues`,
 * public key, signature. Never throws: a throwing `inspect` is reported as `PROTOBUF_DECODE_FAILED`.
 */
export function runPayloadCheck<P, D>({
  bytes,
  encodingIssue,
  formatIssues = [],
  sizeIssues = [],
  partnerPublicKey,
  checkSignature,
  ...decoding
}: PayloadDecoding<P, D> & {
  bytes: Uint8Array | undefined;
  encodingIssue: SwapPayloadIssue;
  formatIssues?: SwapPayloadIssue[];
  sizeIssues?: SwapPayloadIssue[];
  partnerPublicKey: SwapNgPartnerPublicKey;
  checkSignature: (bytes: Uint8Array) => SwapPayloadIssue[];
}): PayloadCheckReport<D> {
  const { decoded, issues: decodingIssues } = bytes
    ? inspectPayloadBytes(bytes, decoding)
    : { decoded: undefined, issues: [encodingIssue] };
  const canCheckSignature = bytes && isValidSwapNgPartnerPublicKey(partnerPublicKey);

  const issues = [
    ...formatIssues,
    ...decodingIssues,
    ...sizeIssues,
    ...partnerPublicKeyIssues(partnerPublicKey),
    ...(canCheckSignature ? checkSignature(bytes) : []),
  ];

  return {
    valid: !issues.some(({ severity }) => severity === "error"),
    ...(decoded ? { decoded } : {}),
    issues,
  };
}

/**
 * `runPayloadCheck` for a base64url NG payload signed over `"." + payload`. Ledger Live adds the
 * "." itself, so a leading "." is an error and the other checks run on the payload without it.
 */
export function runNgPayloadCheck<P, D>({
  payload: rawPayload,
  signature,
  partnerPublicKey,
  messageName,
  wireFields,
  decode,
  inspect,
}: {
  payload: string;
  signature: string;
  partnerPublicKey: SwapNgPartnerPublicKey;
  messageName: string;
  wireFields: WireField[];
  decode: (bytes: Uint8Array) => P;
  inspect: Inspect<P, D>;
}): PayloadCheckReport<D> {
  const hasLeadingDot = rawPayload.startsWith(".");
  const payload = hasLeadingDot ? rawPayload.slice(1) : rawPayload;

  return runPayloadCheck({
    bytes: decodeNgPayload(payload),
    encodingIssue: issueError(
      "INVALID_ENCODING",
      'The payload must be base64url, as the Exchange app decodes it: A-Z, a-z, 0-9, "-" and "_" ("/" is tolerated), with optional "=" padding (at most two, only at the end). "+", spaces and any other character are not supported, and the length must not be 4n+1 characters.',
    ),
    formatIssues: hasLeadingDot
      ? [
          issueError(
            "PAYLOAD_LEADING_DOT",
            'The payload starts with ".". Ledger Live adds the "." itself before sending the payload to the device: send the base64url payload without it.',
          ),
        ]
      : [],
    sizeIssues: apduSizeIssues("ng", Buffer.byteLength(payload, "utf8")),
    messageName,
    wireFields,
    decode,
    inspect,
    partnerPublicKey,
    checkSignature: () => ngSignatureIssues(payload, signature, partnerPublicKey),
  });
}

function ngSignatureIssues(
  payload: string,
  signature: string,
  partnerPublicKey: SwapNgPartnerPublicKey,
): SwapPayloadIssue[] {
  switch (classifySwapNgSignature(payload, signature, partnerPublicKey)) {
    case "valid":
      return [];
    case "valid_leading_zero_r":
    case "valid_leading_zero_s":
    case "valid_leading_zero_rs":
      return [
        issueWarning(
          "SIGNATURE_LEADING_ZERO",
          "The signature is valid but r and/or s starts with a 0x00 byte, a known firmware R/S-to-DER edge case: the device may still reject it. Re-sign the payload.",
        ),
      ];
    case "signed_without_dot_prefix":
      return [
        issueError(
          "SIGNATURE_WITHOUT_DOT_PREFIX",
          'The signature was computed over the payload without the "." prefix. Sign the bytes of "." + payload.',
        ),
      ];
    case "signed_raw_protobuf":
      return [
        issueError(
          "SIGNATURE_OVER_RAW_PROTOBUF",
          'The signature was computed over the raw protobuf bytes. Sign the bytes of "." + base64url(payload).',
        ),
      ];
    case "invalid":
      return [
        issueError(
          "SIGNATURE_INVALID",
          'The signature does not verify: wrong key or curve, or the signature does not match the payload. Sign SHA-256("." + payload) with the partner private key.',
        ),
      ];
    case "signature_malformed":
      return [
        issueError(
          "SIGNATURE_MALFORMED",
          "The signature must be the base64url of a 64-byte compact r||s signature (not DER).",
        ),
      ];
  }
}

type FieldValue = { field: string; value: unknown };

/** The text the Exchange app reads from a nanopb string: everything before the first NUL. */
export const cStringOf = (text: string): string => text.split("\0")[0];

const isMissing = (value: unknown): boolean =>
  typeof value === "string" ? cStringOf(value) === "" : measureBytes(value) === 0;

export function requiredFieldIssues(
  required: FieldValue[],
  amounts: FieldValue[],
): SwapPayloadIssue[] {
  const missing = required
    .filter(({ value }) => isMissing(value))
    .map(({ field }) =>
      issueError("MISSING_FIELD", `Required field "${field}" is missing or empty.`, field),
    );
  const zero = amounts
    .filter(
      ({ value }) =>
        value instanceof Uint8Array && value.length > 0 && value.every(byte => byte === 0),
    )
    .map(({ field }) =>
      issueError("ZERO_AMOUNT", `Field "${field}" must be greater than 0.`, field),
    );
  return [...missing, ...zero];
}

export function ngNonceIssues(field: string, nonce: unknown): SwapPayloadIssue[] {
  const nonceBytes = measureBytes(nonce);
  if (nonceBytes === 0 || nonceBytes === NG_NONCE_BYTES) return [];
  return [
    issueError(
      "INVALID_DEVICE_TRANSACTION_ID",
      `Field "${field}" must be exactly ${NG_NONCE_BYTES} bytes (the nonce returned by the device), got ${nonceBytes} bytes.`,
      field,
    ),
  ];
}

export const fieldLimitIssues = (violations: FieldLimitViolation[]): SwapPayloadIssue[] =>
  violations.map(({ field, limit, actual }) =>
    issueError(
      "FIELD_EXCEEDS_LIMIT",
      `Field "${field}" is ${actual} bytes, the Exchange app accepts at most ${limit} bytes.`,
      field,
    ),
  );

export type ComparedValue = string | bigint | undefined;

export const sameHexNonce = (expected: ComparedValue, actual: ComparedValue): boolean =>
  String(expected).replace(/^0x/i, "").toLowerCase() === String(actual).toLowerCase();

const cStringView = (value: ComparedValue): ComparedValue =>
  typeof value === "string" ? cStringOf(value) : value;

/** Without a custom `equals`, a string is compared as the Exchange app reads it, up to its first NUL. */
export const expectedValueIssues = (
  comparisons: {
    field: string;
    expected: ComparedValue;
    actual: ComparedValue;
    equals?: (expected: ComparedValue, actual: ComparedValue) => boolean;
  }[],
): SwapPayloadIssue[] =>
  comparisons
    .map(({ actual, equals, ...comparison }) => ({
      ...comparison,
      actual: equals ? actual : cStringView(actual),
      equals: equals ?? ((a: ComparedValue, b: ComparedValue) => a === b),
    }))
    .filter(({ expected, actual, equals }) => expected !== undefined && !equals(expected, actual))
    .map(({ field, expected, actual }) =>
      issueError(
        "EXPECTED_VALUE_MISMATCH",
        `Field "${field}" is "${String(actual ?? "")}", expected "${String(expected)}".`,
        field,
      ),
    );

// Ledger Live sends the uint64 fee in 1 to 8 bytes, after a 1-byte fee length.
const MAX_FEE_LENGTH = 8;
const FEE_LENGTHS = Array.from({ length: MAX_FEE_LENGTH }, (_, index) => index + 1);
const FEE_LENGTH_FIELD_BYTES = 1;

type ApduLimit = {
  headerBytes: number;
  maxIntactDataBytes: number;
  otherIntactDataBytes: number[];
  unit: string;
  layout: string;
};

const APDU_LIMITS: Record<"ng" | "legacy", ApduLimit> = {
  ng: {
    headerBytes: 3,
    // hw-app-exchange `Exchange.processSplitTransaction` drops bytes at 510 and 511 bytes of data,
    // app-exchange receives at most 512 bytes.
    maxIntactDataBytes: 509,
    otherIntactDataBytes: [512],
    unit: "base64url characters",
    layout:
      "Ledger Live sends it to the Exchange app as [encoding (1 byte), payload length (2 bytes), payload, fee length (1 byte), fee], which only reaches the device intact at up to 509 bytes or at exactly 512 bytes (Ledger Live's APDU split drops bytes at 510 and 511 bytes, and the Exchange app receives at most 512 bytes)",
  },
  legacy: {
    headerBytes: 1,
    maxIntactDataBytes: 255,
    otherIntactDataBytes: [],
    unit: "decoded hex",
    layout:
      "Ledger Live sends a legacy swap in a single APDU as [payload length (1 byte), payload, fee length (1 byte), fee], and the transport rejects APDU data of 256 bytes or more",
  },
};

export const lastOf = <T>(values: T[]): T | undefined => {
  const [last] = values.slice(-1);
  return last;
};

const formatFeeLengths = (feeLengths: number[]): string =>
  feeLengths.length === 1
    ? String(feeLengths[0])
    : `${feeLengths.slice(0, -1).join(", ")} or ${lastOf(feeLengths)}`;

/**
 * `PAYLOAD_TOO_LARGE` when the APDU data cannot reach the device with any fee of 1 to 8 bytes,
 * `PAYLOAD_NEAR_SIZE_LIMIT` when it cannot with some of them.
 *
 * @param payloadBytes "ng": base64url characters sent (no leading "."), "legacy": protobuf bytes
 */
export function apduSizeIssues(format: "ng" | "legacy", payloadBytes: number): SwapPayloadIssue[] {
  const { headerBytes, maxIntactDataBytes, otherIntactDataBytes, unit, layout } =
    APDU_LIMITS[format];
  const isDelivered = (dataBytes: number) =>
    dataBytes <= maxIntactDataBytes || otherIntactDataBytes.includes(dataBytes);
  const failingFeeLengths = FEE_LENGTHS.filter(
    feeLength => !isDelivered(headerBytes + payloadBytes + FEE_LENGTH_FIELD_BYTES + feeLength),
  );
  const maxPayloadAnyFee =
    maxIntactDataBytes - headerBytes - FEE_LENGTH_FIELD_BYTES - MAX_FEE_LENGTH;
  const size = `${payloadBytes} bytes (${unit})`;
  const advice = `Keep the payload at most ${maxPayloadAnyFee} bytes to fit any fee of up to 8 bytes.`;

  if (failingFeeLengths.length === FEE_LENGTHS.length) {
    return [
      issueError(
        "PAYLOAD_TOO_LARGE",
        `The payload is ${size}. ${layout}: it does not fit with any fee of 1 to 8 bytes. Shorten the payload (e.g. optional fields). ${advice}`,
      ),
    ];
  }
  if (failingFeeLengths.length > 0) {
    return [
      issueWarning(
        "PAYLOAD_NEAR_SIZE_LIMIT",
        `The payload is ${size}, close to the size limit. ${layout}: a fee of ${formatFeeLengths(failingFeeLengths)} bytes would make the transaction fail. ${advice}`,
      ),
    ];
  }
  return [];
}

const MAX_VARINT_BYTES = 10;

// Values above 2^53 lose precision, which is fine for a buffer length or a uint32 field.
function readVarint(
  bytes: Uint8Array,
  offset: number,
): { value: number; next: number } | undefined {
  let value = 0;
  for (let index = 0; index < MAX_VARINT_BYTES; index++) {
    const at = offset + index;
    if (at >= bytes.length) return undefined;
    const byte = bytes[at];
    value += (byte & 0x7f) * 2 ** (7 * index);
    if ((byte & 0x80) === 0) return { value, next: at + 1 };
  }
  return undefined;
}

// Like nanopb `pb_skip_varint`: no length or overflow limit.
function skipVarint(bytes: Uint8Array, offset: number): number | undefined {
  for (let at = offset; at < bytes.length; at++) {
    if ((bytes[at] & 0x80) === 0) return at + 1;
  }
  return undefined;
}

/**
 * A protobuf field the Exchange app decodes, with its nanopb `max_size` from app-exchange
 * `src/proto/protocol.options` for a string or bytes field.
 */
export type WireField = { fieldNumber: number; protoName: string } & (
  | { kind: "string" | "bytes"; maxSize: number }
  | { kind: "varint" }
  | { kind: "message"; fields: WireField[] }
);

export type WireScan = {
  /** every occurrence of each string, bytes or varint field, in wire order */
  occurrences: Map<WireField, Uint8Array[]>;
  violations: FieldLimitViolation[];
};

const VARINT_WIRE_TYPE = 0;
const LENGTH_DELIMITED_WIRE_TYPE = 2;
const FIXED_WIRE_TYPE_BYTES: Record<number, number> = { 1: 8, 5: 4 };
const MAX_TAG = 0xffffffff;

function readWireValue(
  bytes: Uint8Array,
  offset: number,
  wireType: number,
): { content: Uint8Array; next: number } | undefined {
  if (wireType === LENGTH_DELIMITED_WIRE_TYPE) {
    const length = readVarint(bytes, offset);
    if (!length || length.value > bytes.length - length.next) return undefined;
    const next = length.next + length.value;
    return { content: bytes.subarray(length.next, next), next };
  }
  const next =
    wireType === VARINT_WIRE_TYPE
      ? skipVarint(bytes, offset)
      : offset + (FIXED_WIRE_TYPE_BYTES[wireType] ?? Infinity);
  if (next === undefined || next > bytes.length) return undefined;
  return { content: bytes.subarray(offset, next), next };
}

function readTag(
  bytes: Uint8Array,
  offset: number,
): { fieldNumber: number; wireType: number; next: number } | undefined {
  const tag = readVarint(bytes, offset);
  // nanopb rejects field number 0 ("zero tag") and a tag that does not fit in 32 bits.
  if (!tag || tag.value < 8 || tag.value > MAX_TAG) return undefined;
  return { fieldNumber: Math.floor(tag.value / 8), wireType: tag.value % 8, next: tag.next };
}

function scanKnownField(
  field: WireField,
  wireType: number,
  content: Uint8Array,
  occurrences: Map<WireField, Uint8Array[]>,
): boolean {
  const expectedWireType = field.kind === "varint" ? VARINT_WIRE_TYPE : LENGTH_DELIMITED_WIRE_TYPE;
  if (wireType !== expectedWireType) return false;
  // nanopb `pb_decode_varint` rejects an 11th byte ("varint overflow"), not a 10th byte above 0x01.
  if (field.kind === "varint" && content.length > MAX_VARINT_BYTES) return false;
  if (field.kind === "message") return scanMessage(content, field.fields, occurrences);
  occurrences.set(field, [...(occurrences.get(field) ?? []), content]);
  return true;
}

function scanMessage(
  bytes: Uint8Array,
  fields: WireField[],
  occurrences: Map<WireField, Uint8Array[]>,
): boolean {
  const fieldsByNumber = new Map(fields.map(field => [field.fieldNumber, field]));
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readTag(bytes, offset);
    if (!tag) return false;
    const value = readWireValue(bytes, tag.next, tag.wireType);
    if (!value) return false;
    offset = value.next;

    const field = fieldsByNumber.get(tag.fieldNumber);
    if (field && !scanKnownField(field, tag.wireType, value.content, occurrences)) return false;
  }
  return true;
}

function limitViolations(
  fields: WireField[],
  occurrences: Map<WireField, Uint8Array[]>,
): FieldLimitViolation[] {
  return fields.flatMap(field => {
    if (field.kind === "message") return limitViolations(field.fields, occurrences);
    if (field.kind === "varint") return [];
    // nanopb reserves the NUL terminator of a string in `max_size`.
    const limit = field.kind === "string" ? field.maxSize - 1 : field.maxSize;
    const actual = Math.max(0, ...(occurrences.get(field) ?? []).map(({ length }) => length));
    return actual > limit ? [{ field: field.protoName, limit, actual }] : [];
  });
}

/**
 * Walks raw protobuf bytes like nanopb `pb_decode` in app-exchange, which also rejects what
 * protobufjs accepts: `undefined` for truncated data, a group or invalid wire type, or a known
 * field with another wire type. Limits are checked on every occurrence of a field: nanopb fails
 * on an oversized one even when a later duplicate fits.
 */
export function scanWireFields(bytes: Uint8Array, fields: WireField[]): WireScan | undefined {
  const occurrences = new Map<WireField, Uint8Array[]>();
  if (!scanMessage(bytes, fields, occurrences)) return undefined;
  return { occurrences, violations: limitViolations(fields, occurrences) };
}

/**
 * The value nanopb keeps for a field: its last occurrence, including across repeated occurrences
 * of the embedded message holding it, which nanopb merges where protobufjs keeps the last one.
 */
export const lastWireValue = (wire: WireScan, field: WireField): Uint8Array | undefined =>
  lastOf(wire.occurrences.get(field) ?? []);

export const wireVarintValue = (content: Uint8Array): number | undefined =>
  readVarint(content, 0)?.value;
