import { base64UrlDecode } from "./shared-utils";
import { measureBytes, type FieldLimitViolation } from "./SwapUtils";
import {
  classifySwapNgSignature,
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
const issueWarning = createIssue("warning");

const NG_NONCE_BYTES = 32;
const COMPRESSED_PUBLIC_KEY_BYTES = 33;
// Characters app-exchange src/base64.c decodes correctly, it garbles any other one ("+" included).
const NG_PAYLOAD_PATTERN = /^[A-Za-z0-9_/-]+={0,2}$/;

/** Decodes an NG payload like the Exchange app, `undefined` when it would reject or garble it. */
function decodeNgPayload(payload: string): Uint8Array | undefined {
  if (!NG_PAYLOAD_PATTERN.test(payload) || payload.length % 4 === 1) return undefined;
  return base64UrlDecode(payload);
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
  messageName,
  wireFields,
  decode,
  inspect,
  partnerPublicKey,
  checkSignature,
}: {
  bytes: Uint8Array | undefined;
  encodingIssue: SwapPayloadIssue;
  formatIssues?: SwapPayloadIssue[];
  sizeIssues?: SwapPayloadIssue[];
  messageName: string;
  wireFields: WireField[];
  decode: (bytes: Uint8Array) => P;
  inspect: Inspect<P, D>;
  partnerPublicKey: SwapNgPartnerPublicKey;
  checkSignature: (bytes: Uint8Array) => SwapPayloadIssue[];
}): PayloadCheckReport<D> {
  const issues: SwapPayloadIssue[] = [...formatIssues];
  let decoded: D | undefined;

  if (!bytes) {
    issues.push(encodingIssue);
  } else {
    let proto: P | undefined;
    try {
      proto = decode(bytes);
    } catch {
      issues.push(
        issueError(
          "PROTOBUF_DECODE_FAILED",
          `The payload bytes are not a valid ledger_trade.${messageName} protobuf message.`,
        ),
      );
    }
    if (proto) {
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
        decoded = inspection.decoded;
        issues.push(...inspection.issues);
      } catch {
        issues.push(
          issueError(
            "PROTOBUF_DECODE_FAILED",
            `The payload decodes as a ledger_trade.${messageName} protobuf message but its fields could not be read.`,
          ),
        );
      }
    }
  }

  issues.push(...sizeIssues);

  if (!isValidSwapNgPartnerPublicKey(partnerPublicKey)) {
    issues.push(
      issueError(
        "PUBLIC_KEY_MALFORMED",
        `The partner public key is not a valid ${partnerPublicKey.curve} point. Provide the 65-byte uncompressed public key (0x04 prefix), the form registered with Ledger and sent to the Exchange app. A 33-byte compressed key is also accepted here, for verification only.`,
      ),
    );
  } else {
    if (partnerPublicKey.data.length === COMPRESSED_PUBLIC_KEY_BYTES) {
      issues.push(
        issueWarning(
          "PUBLIC_KEY_COMPRESSED",
          "The partner public key is the 33-byte compressed form. The signature is verified with it here, but the key registered with Ledger must be the 65-byte uncompressed form (0x04 prefix): the Exchange app only accepts an uncompressed partner key.",
        ),
      );
    }
    if (bytes) issues.push(...checkSignature(bytes));
  }

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

export function requiredFieldIssues(
  required: FieldValue[],
  amounts: FieldValue[],
): SwapPayloadIssue[] {
  const missing = required
    .filter(({ value }) => measureBytes(value) === 0)
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

export const sameHexNonce = (expected: unknown, actual: unknown): boolean =>
  String(expected).replace(/^0x/i, "").toLowerCase() === String(actual).toLowerCase();

export const expectedValueIssues = (
  comparisons: {
    field: string;
    expected: unknown;
    actual: unknown;
    equals?: (expected: unknown, actual: unknown) => boolean;
  }[],
): SwapPayloadIssue[] =>
  comparisons
    .filter(
      ({ expected, actual, equals = (a, b) => a === b }) =>
        expected !== undefined && !equals(expected, actual),
    )
    .map(({ field, expected, actual }) =>
      issueError(
        "EXPECTED_VALUE_MISMATCH",
        `Field "${field}" is "${String(actual ?? "")}", expected "${String(expected)}".`,
        field,
      ),
    );

// [fee length (1), fee]: Ledger Live sends the uint64 fee in 1 to 8 bytes.
const FEE_FIELD_BYTES = { min: 1 + 1, max: 1 + 8 };

// NG: the 509-byte limit comes from hw-app-exchange `Exchange.processSplitTransaction`, which
// corrupts 510 and 511 bytes, app-exchange receives at most 512.
// Legacy: a single APDU, the transport rejects 256 bytes or more.
const APDU_LIMITS = {
  ng: {
    maxDataBytes: 509,
    headerBytes: 3,
    unit: "base64url characters",
    layout:
      "Ledger Live sends it to the Exchange app as [encoding (1 byte), payload length (2 bytes), payload, fee length (1 byte), fee], which only reaches the device intact up to 509 bytes (Ledger Live's APDU split drops bytes at 510 and 511 bytes, and the Exchange app receives at most 512 bytes)",
  },
  legacy: {
    maxDataBytes: 255,
    headerBytes: 1,
    unit: "decoded hex",
    layout:
      "Ledger Live sends a legacy swap in a single APDU as [payload length (1 byte), payload, fee length (1 byte), fee], and the transport rejects APDU data of 256 bytes or more",
  },
};

/**
 * `PAYLOAD_TOO_LARGE` when the APDU data exceeds the limit even with a 1-byte fee,
 * `PAYLOAD_NEAR_SIZE_LIMIT` when a fee of up to 8 bytes could exceed it.
 *
 * @param payloadBytes "ng": base64url characters sent (no leading "."), "legacy": protobuf bytes
 */
export function apduSizeIssues(format: "ng" | "legacy", payloadBytes: number): SwapPayloadIssue[] {
  const { maxDataBytes, headerBytes, unit, layout } = APDU_LIMITS[format];
  const maxPayload = maxDataBytes - headerBytes - FEE_FIELD_BYTES.min;
  const maxPayloadAnyFee = maxDataBytes - headerBytes - FEE_FIELD_BYTES.max;
  const size = `${payloadBytes} bytes (${unit})`;

  if (payloadBytes > maxPayload) {
    return [
      issueError(
        "PAYLOAD_TOO_LARGE",
        `The payload is ${size}. ${layout}: the payload must be at most ${maxPayload} bytes even with the smallest (1-byte) fee. Shorten the payload (e.g. optional fields).`,
      ),
    ];
  }
  if (payloadBytes > maxPayloadAnyFee) {
    return [
      issueWarning(
        "PAYLOAD_NEAR_SIZE_LIMIT",
        `The payload is ${size}, close to the size limit. ${layout}: a fee longer than ${maxPayload + 1 - payloadBytes} bytes would make the transaction fail. Keep the payload at most ${maxPayloadAnyFee} bytes to fit any fee of up to 8 bytes.`,
      ),
    ];
  }
  return [];
}

// Values above 2^53 lose precision, which is fine: they are only compared to a buffer length.
function readVarint(
  bytes: Uint8Array,
  offset: number,
): { value: number; next: number } | undefined {
  let value = 0;
  for (let index = 0; index < 10; index++) {
    const at = offset + index;
    if (at >= bytes.length) return undefined;
    const byte = bytes[at];
    value += (byte & 0x7f) * 2 ** (7 * index);
    if ((byte & 0x80) === 0) return { value, next: at + 1 };
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
  /** every occurrence of each string or bytes field, in wire order */
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
      ? readVarint(bytes, offset)?.next
      : offset + (FIXED_WIRE_TYPE_BYTES[wireType] ?? Infinity);
  if (next === undefined || next > bytes.length) return undefined;
  return { content: bytes.subarray(offset, next), next };
}

function scanMessage(
  bytes: Uint8Array,
  fields: WireField[],
  occurrences: Map<WireField, Uint8Array[]>,
): boolean {
  const fieldsByNumber = new Map(fields.map(field => [field.fieldNumber, field]));
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    // nanopb rejects field number 0 ("zero tag") and a tag that does not fit in 32 bits.
    if (!tag || tag.value < 8 || tag.value > MAX_TAG) return false;
    const wireType = tag.value % 8;
    const value = readWireValue(bytes, tag.next, wireType);
    if (!value) return false;
    offset = value.next;

    const field = fieldsByNumber.get(Math.floor(tag.value / 8));
    if (!field) continue;
    const expectedWireType =
      field.kind === "varint" ? VARINT_WIRE_TYPE : LENGTH_DELIMITED_WIRE_TYPE;
    if (wireType !== expectedWireType) return false;
    if (field.kind === "message") {
      if (!scanMessage(value.content, field.fields, occurrences)) return false;
    } else if (field.kind !== "varint") {
      occurrences.set(field, [...(occurrences.get(field) ?? []), value.content]);
    }
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
