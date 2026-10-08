import {
  decodeNewTransactionResponseBytes,
  NEW_TRANSACTION_RESPONSE_FIELD_LIMITS,
  toSwapPayload,
  type SwapPayload,
  type SwapProtobufPayload,
} from "./SwapUtils";
import { verifyCompactSignature, type SwapNgPartnerPublicKey } from "./SwapSignature";
import { isHexadecimal } from "./shared-utils";
import {
  apduSizeIssues,
  expectedValueIssues,
  fieldLimitIssues,
  issueError,
  ngNonceIssues,
  requiredFieldIssues,
  runNgPayloadCheck,
  runPayloadCheck,
  sameHexNonce,
  type ComparedValue,
  type PayloadCheckReport,
  type SwapPayloadIssue,
  type WireField,
  type WireScan,
} from "./PayloadCheckerShared";

export type { SwapPayloadIssue, SwapPayloadIssueCode } from "./PayloadCheckerShared";

export type SwapPayloadCheckInput = {
  /**
   * "ng": base64url `NewTransactionResponse`, without the leading "." Ledger Live adds.
   * "legacy": hex of the raw protobuf `NewTransactionResponse`, without a "0x" prefix.
   */
  payload: string;
  /**
   * 64-byte compact r||s signature, base64url for "ng", 128 hex characters for "legacy".
   */
  signature: string;
  partnerPublicKey: SwapNgPartnerPublicKey;
  format?: "ng" | "legacy";
  /** values the payload must contain, only the provided keys are compared */
  expected?: {
    /**
     * nonce returned by `startNewTransaction`: 32-byte hex for "ng" (case-insensitive, optional
     * "0x"), 10 characters for "legacy"
     */
    deviceTransactionId?: string;
    currencyFrom?: string;
    currencyTo?: string;
    amountToProvider?: bigint;
    amountToWallet?: bigint;
    payinAddress?: string;
    payoutAddress?: string;
    refundAddress?: string;
  };
};

/**
 * A decoded `NewTransactionResponse` as reported by `checkSwapPayload`.
 */
export type DecodedSwapPayload = SwapPayload & {
  /** hex of `payin_extra_data` (field 13) */
  payinExtraData?: string;
};

export type SwapPayloadCheckReport = PayloadCheckReport<DecodedSwapPayload>;

type SwapExpected = NonNullable<SwapPayloadCheckInput["expected"]>;

const protoFieldName = (key: string): string =>
  key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const REQUIRED_KEYS = [
  "payinAddress",
  "payoutAddress",
  "refundAddress",
  "currencyFrom",
  "currencyTo",
  "amountToProvider",
  "amountToWallet",
] as const;
const AMOUNT_KEYS = ["amountToProvider", "amountToWallet"] as const;
const EXPECTED_KEYS = [
  "currencyFrom",
  "currencyTo",
  "amountToProvider",
  "amountToWallet",
  "payinAddress",
  "payoutAddress",
  "refundAddress",
] as const;

type NonceRules = {
  key: "deviceTransactionIdNg" | "deviceTransactionId";
  issues: (proto: SwapProtobufPayload) => SwapPayloadIssue[];
  equals: (expected: ComparedValue, actual: ComparedValue) => boolean;
};

const NG_NONCE: NonceRules = {
  key: "deviceTransactionIdNg",
  issues: proto => ngNonceIssues("device_transaction_id_ng", proto.deviceTransactionIdNg),
  equals: sameHexNonce,
};

const LEGACY_NONCE_PATTERN = /^[\x20-\x7e]{10}$/;

const LEGACY_NONCE: NonceRules = {
  key: "deviceTransactionId",
  issues: ({ deviceTransactionId }) =>
    deviceTransactionId && !LEGACY_NONCE_PATTERN.test(deviceTransactionId)
      ? [
          issueError(
            "INVALID_DEVICE_TRANSACTION_ID",
            `Field "device_transaction_id" must be exactly 10 printable ASCII characters (the nonce returned by the device), got ${deviceTransactionId.length} characters.`,
            "device_transaction_id",
          ),
        ]
      : [],
  equals: (expected, actual) => expected === actual,
};

// `toSwapPayload` cannot convert empty amount bytes, already reported as MISSING_FIELD.
const orZeroAmount = (bytes: Buffer): Buffer =>
  bytes && bytes.length > 0 ? bytes : Buffer.from([0x00]);

const lastOf = <T>(values: T[]): T | undefined => {
  const [last] = values.slice(-1);
  return last;
};

const PAYIN_EXTRA_DATA_BYTES = 33;

// Not in the generated JS protocol, only read from the raw bytes.
const PAYIN_EXTRA_DATA_FIELD: WireField = {
  fieldNumber: 13,
  protoName: "payin_extra_data",
  kind: "bytes",
  maxSize: PAYIN_EXTRA_DATA_BYTES,
};

const NEW_TRANSACTION_RESPONSE_FIELDS: WireField[] = [
  ...NEW_TRANSACTION_RESPONSE_FIELD_LIMITS,
  PAYIN_EXTRA_DATA_FIELD,
];

// Mirrors app-exchange `check_extra_id_extra_data`.
function payinExtraDataIssues(
  proto: SwapProtobufPayload,
  occurrences: Uint8Array[],
): SwapPayloadIssue[] {
  if (occurrences.some(({ length }) => length > PAYIN_EXTRA_DATA_BYTES)) return [];

  // As in protobuf decoders, the last occurrence wins.
  const extraData = lastOf(occurrences);
  const isEmptyOrNativeId = !extraData?.length || (extraData.length === 1 && extraData[0] === 0x00);
  if (!extraData || isEmptyOrNativeId) return [];

  const issues: SwapPayloadIssue[] = [];
  const payinExtraId = proto.payinExtraId ?? "";
  if (payinExtraId.length > 0 && !payinExtraId.startsWith("\0")) {
    issues.push(
      issueError(
        "EXTRA_ID_AND_EXTRA_DATA",
        'Fields "payin_extra_id" and "payin_extra_data" are both set: the Exchange app accepts only one of them (WRONG_EXTRA_ID_OR_EXTRA_DATA). Remove one.',
        "payin_extra_data",
      ),
    );
  }
  if (extraData.length !== PAYIN_EXTRA_DATA_BYTES) {
    issues.push(
      issueError(
        "INVALID_PAYIN_EXTRA_DATA",
        `Field "payin_extra_data" is ${extraData.length} bytes: the Exchange app accepts it empty, as the single byte 0x00, or exactly ${PAYIN_EXTRA_DATA_BYTES} bytes (a 1-byte header and a 32-byte hash).`,
        "payin_extra_data",
      ),
    );
  }
  return issues;
}

function inspectSwap(
  proto: SwapProtobufPayload,
  wire: WireScan,
  nonce: NonceRules,
  expected: SwapExpected | undefined,
): { decoded: DecodedSwapPayload; issues: SwapPayloadIssue[] } {
  const extraDataOccurrences = wire.occurrences.get(PAYIN_EXTRA_DATA_FIELD) ?? [];
  const payinExtraData = lastOf(extraDataOccurrences);
  const decoded: DecodedSwapPayload = {
    ...toSwapPayload({
      ...proto,
      amountToProvider: orZeroAmount(proto.amountToProvider),
      amountToWallet: orZeroAmount(proto.amountToWallet),
    }),
    ...(payinExtraData ? { payinExtraData: Buffer.from(payinExtraData).toString("hex") } : {}),
  };

  const issues = [
    ...requiredFieldIssues(
      [...REQUIRED_KEYS, nonce.key].map(key => ({ field: protoFieldName(key), value: proto[key] })),
      AMOUNT_KEYS.map(key => ({ field: protoFieldName(key), value: proto[key] })),
    ),
    ...nonce.issues(proto),
    ...fieldLimitIssues(wire.violations),
    ...payinExtraDataIssues(proto, extraDataOccurrences),
    ...expectedValueIssues([
      {
        field: protoFieldName(nonce.key),
        expected: expected?.deviceTransactionId,
        actual: decoded[nonce.key] ?? "",
        equals: nonce.equals,
      },
      ...EXPECTED_KEYS.map(key => ({
        field: protoFieldName(key),
        expected: expected?.[key],
        actual: decoded[key],
      })),
    ]),
  ];

  return { decoded, issues };
}

const LEGACY_SIGNATURE_PATTERN = /^[0-9a-fA-F]{128}$/;

const decodeHex = (hex: string): Uint8Array | undefined =>
  isHexadecimal(hex) && hex.length % 2 === 0 ? Buffer.from(hex, "hex") : undefined;

// Ledger Live sends `Buffer.from(payload, "hex")`, which decodes a "0x" prefixed payload to no bytes.
function decodeLegacyPayload(payload: string): {
  bytes: Uint8Array | undefined;
  formatIssues: SwapPayloadIssue[];
} {
  const hasHexPrefix = /^0x/i.test(payload);
  const bytes = decodeHex(hasHexPrefix ? payload.slice(2) : payload);
  return {
    bytes,
    formatIssues:
      hasHexPrefix && bytes
        ? [
            issueError(
              "INVALID_ENCODING",
              'The payload starts with "0x". Ledger Live hex-decodes the legacy payload as is, so the device would receive no bytes: remove the "0x" prefix.',
            ),
          ]
        : [],
  };
}

function legacySignatureIssues(
  rawPayload: Uint8Array,
  signature: string,
  partnerPublicKey: SwapNgPartnerPublicKey,
): SwapPayloadIssue[] {
  // app-exchange `set_partner_key.c` always uses secp256k1 for a legacy swap.
  if (partnerPublicKey.curve !== "secp256k1") {
    return [
      issueError(
        "LEGACY_CURVE_UNSUPPORTED",
        `The partner public key is on ${partnerPublicKey.curve}, but the Exchange app verifies a legacy swap signature on secp256k1 only. Sign with a secp256k1 key, or use Swap NG to sign with ${partnerPublicKey.curve}.`,
      ),
    ];
  }

  const malformed = issueError(
    "SIGNATURE_MALFORMED",
    'Ledger Live expects the legacy swap signature as 128 hex characters: the 64-byte compact r||s signature (no "0x" prefix, not base64url, not DER).',
  );
  if (!LEGACY_SIGNATURE_PATTERN.test(signature)) return [malformed];

  try {
    return verifyCompactSignature(partnerPublicKey, Buffer.from(signature, "hex"), rawPayload)
      ? []
      : [
          issueError(
            "SIGNATURE_INVALID",
            "The signature does not verify: wrong key or curve, or the signature does not match the payload. Sign SHA-256(raw protobuf bytes) with the partner private key.",
          ),
        ];
  } catch {
    return [malformed];
  }
}

/**
 * Checks a Swap NG (default) or legacy Swap payload and its partner signature against the rules
 * of Ledger Live and the Exchange app, without a device. Fee, address ownership and coin app
 * checks still happen on the device. Pure and synchronous, inputs are never logged.
 */
export function checkSwapPayload(input: SwapPayloadCheckInput): SwapPayloadCheckReport {
  const { payload, signature, partnerPublicKey, expected } = input;
  const messageName = "NewTransactionResponse";
  const decode = decodeNewTransactionResponseBytes;

  if (input.format === "legacy") {
    const { bytes, formatIssues } = decodeLegacyPayload(payload);
    return runPayloadCheck({
      bytes,
      formatIssues,
      sizeIssues: bytes ? apduSizeIssues("legacy", bytes.length) : [],
      encodingIssue: issueError(
        "INVALID_ENCODING",
        'A legacy swap payload must be the hex of the raw protobuf bytes, without a "0x" prefix: an even number of 0-9, a-f, A-F characters.',
      ),
      messageName,
      wireFields: NEW_TRANSACTION_RESPONSE_FIELDS,
      decode,
      inspect: (proto, wire) => inspectSwap(proto, wire, LEGACY_NONCE, expected),
      partnerPublicKey,
      checkSignature: raw => legacySignatureIssues(raw, signature, partnerPublicKey),
    });
  }

  return runNgPayloadCheck({
    payload,
    signature,
    partnerPublicKey,
    messageName,
    wireFields: NEW_TRANSACTION_RESPONSE_FIELDS,
    decode,
    inspect: (proto, wire) => inspectSwap(proto, wire, NG_NONCE, expected),
  });
}
