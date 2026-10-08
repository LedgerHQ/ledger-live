import { ledger_trade } from "./generate-protocol";
import type { SwapNgPartnerPublicKey } from "./SwapSignature";
import { findSellFieldLimitViolations } from "./SwapUtils";
import {
  expectedValueIssues,
  fieldLimitIssues,
  issueError,
  ngNonceIssues,
  requiredFieldIssues,
  runNgPayloadCheck,
  sameHexNonce,
  type PayloadCheckReport,
  type SwapPayloadIssue,
} from "./PayloadCheckerShared";

export type SellPayloadCheckInput = {
  /** base64url `NewSellResponse`, without the leading "." Ledger Live adds */
  payload: string;
  /** base64url of the 64-byte compact r||s signature */
  signature: string;
  partnerPublicKey: SwapNgPartnerPublicKey;
  /** values the payload must contain, only the provided keys are compared */
  expected?: {
    /** 32-byte hex nonce returned by `startNewTransaction`, case-insensitive, optional "0x" */
    deviceTransactionId?: string;
    inCurrency?: string;
    inAmount?: bigint;
    inAddress?: string;
    outCurrency?: string;
  };
};

/**
 * A decoded `NewSellResponse`, normalized for display.
 */
export type DecodedSellPayload = {
  traderEmail?: string;
  inCurrency: string;
  inAmount: bigint;
  inAddress: string;
  inExtraId?: string;
  outCurrency: string;
  /** decimal string of `out_amount`, e.g. "84.38", or "<coefficient>e-<exponent>" above 255 */
  outAmount: string;
  /** hex of `device_transaction_id` */
  deviceTransactionId?: string;
};

export type SellPayloadCheckReport = PayloadCheckReport<DecodedSellPayload>;

const toBigInt = (bytes: Uint8Array | null | undefined): bigint =>
  bytes && bytes.length > 0 ? BigInt("0x" + Buffer.from(bytes).toString("hex")) : 0n;

// app-exchange `get_fiat_printable_amount` rejects an exponent above UINT8_MAX.
const MAX_FORMATTED_EXPONENT = 255;

function formatUDecimal(amount: ledger_trade.IUDecimal | null | undefined): string {
  const digits = toBigInt(amount?.coefficient).toString();
  const exponent = amount?.exponent ?? 0;
  if (exponent === 0) return digits;
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > MAX_FORMATTED_EXPONENT) {
    return `${digits}e-${exponent}`;
  }

  const padded = digits.padStart(exponent + 1, "0");
  const fraction = padded.slice(-exponent).replace(/0+$/, "");
  const integer = padded.slice(0, -exponent);
  return fraction ? `${integer}.${fraction}` : integer;
}

function toDecodedSellPayload(proto: ledger_trade.NewSellResponse): DecodedSellPayload {
  const deviceTransactionId = Buffer.from(proto.deviceTransactionId).toString("hex");
  return {
    ...(proto.traderEmail ? { traderEmail: proto.traderEmail } : {}),
    inCurrency: proto.inCurrency,
    inAmount: toBigInt(proto.inAmount),
    inAddress: proto.inAddress,
    ...(proto.inExtraId ? { inExtraId: proto.inExtraId } : {}),
    outCurrency: proto.outCurrency,
    outAmount: formatUDecimal(proto.outAmount),
    ...(deviceTransactionId ? { deviceTransactionId } : {}),
  };
}

// app-exchange trims the leading 0x00 bytes (`trim_amounts`), then only displays a uint64.
const MAX_SIGNIFICANT_COEFFICIENT_BYTES = 8;
// app-exchange protocol.options, already reported by `findSellFieldLimitViolations`.
const MAX_COEFFICIENT_BYTES = 16;
// app-exchange MAX_PRINTABLE_AMOUNT_SIZE, holds "<out_currency> <amount>\0".
const PRINTABLE_AMOUNT_BYTES = 50;

/**
 * `fpuint64_to_str` writes "0." + `exponent` digits + "\0" below 1, at most 22 bytes otherwise:
 * only the exponent can overflow the buffer left after "<out_currency> ".
 */
function maxDisplayableExponent(outCurrency: string): number {
  const tickerBytes = Buffer.byteLength(outCurrency.split("\0")[0], "utf8");
  return PRINTABLE_AMOUNT_BYTES - (tickerBytes + 1) - 3;
}

function outAmountIssues(proto: ledger_trade.NewSellResponse): SwapPayloadIssue[] {
  const issues: SwapPayloadIssue[] = [];
  const coefficient = proto.outAmount?.coefficient ?? new Uint8Array();
  const firstSignificantByte = coefficient.findIndex(byte => byte !== 0);
  const significantBytes =
    firstSignificantByte === -1 ? 0 : coefficient.length - firstSignificantByte;

  if (
    coefficient.length <= MAX_COEFFICIENT_BYTES &&
    significantBytes > MAX_SIGNIFICANT_COEFFICIENT_BYTES
  ) {
    issues.push(
      issueError(
        "FIELD_EXCEEDS_LIMIT",
        `Field "out_amount.coefficient" is ${significantBytes} bytes without its leading 0x00 bytes: the Exchange app can only display an amount whose coefficient fits in 64 bits (at most ${MAX_SIGNIFICANT_COEFFICIENT_BYTES} bytes), so it rejects this sell.`,
        "out_amount.coefficient",
      ),
    );
  }

  const exponent = proto.outAmount?.exponent ?? 0;
  const maxExponent = maxDisplayableExponent(proto.outCurrency ?? "");
  if (exponent > maxExponent) {
    issues.push(
      issueError(
        "FIELD_EXCEEDS_LIMIT",
        `Field "out_amount.exponent" is ${exponent}: the Exchange app displays "<out_currency> <amount>" in a ${PRINTABLE_AMOUNT_BYTES}-byte buffer, which fits at most ${maxExponent} decimals with this out_currency, so it rejects this sell (out_amount = coefficient * 10^-exponent).`,
        "out_amount.exponent",
      ),
    );
  }

  return issues;
}

function inspectSell(
  proto: ledger_trade.NewSellResponse,
  expected: SellPayloadCheckInput["expected"],
): { decoded: DecodedSellPayload; issues: SwapPayloadIssue[] } {
  const decoded = toDecodedSellPayload(proto);
  const outAmountCoefficient = proto.outAmount?.coefficient;

  const issues = [
    ...requiredFieldIssues(
      [
        { field: "in_currency", value: proto.inCurrency },
        { field: "in_amount", value: proto.inAmount },
        { field: "in_address", value: proto.inAddress },
        { field: "out_currency", value: proto.outCurrency },
        { field: "out_amount", value: outAmountCoefficient },
        { field: "device_transaction_id", value: proto.deviceTransactionId },
      ],
      [
        { field: "in_amount", value: proto.inAmount },
        { field: "out_amount", value: outAmountCoefficient },
      ],
    ),
    ...ngNonceIssues("device_transaction_id", proto.deviceTransactionId),
    ...fieldLimitIssues(findSellFieldLimitViolations(proto)),
    ...outAmountIssues(proto),
    ...expectedValueIssues([
      {
        field: "device_transaction_id",
        expected: expected?.deviceTransactionId,
        actual: decoded.deviceTransactionId ?? "",
        equals: sameHexNonce,
      },
      { field: "in_currency", expected: expected?.inCurrency, actual: decoded.inCurrency },
      { field: "in_amount", expected: expected?.inAmount, actual: decoded.inAmount },
      { field: "in_address", expected: expected?.inAddress, actual: decoded.inAddress },
      { field: "out_currency", expected: expected?.outCurrency, actual: decoded.outCurrency },
    ]),
  ];

  return { decoded, issues };
}

/**
 * Checks a Sell NG payload and its partner signature against the rules of Ledger Live and the
 * Exchange app, without a device, with the same issue codes as `checkSwapPayload`. Fee, address
 * ownership and coin app checks still happen on the device. Pure and synchronous, inputs are
 * never logged.
 */
export function checkSellPayload(input: SellPayloadCheckInput): SellPayloadCheckReport {
  return runNgPayloadCheck({
    payload: input.payload,
    signature: input.signature,
    partnerPublicKey: input.partnerPublicKey,
    messageName: "NewSellResponse",
    decode: bytes => ledger_trade.NewSellResponse.decode(bytes),
    inspect: proto => inspectSell(proto, input.expected),
  });
}
