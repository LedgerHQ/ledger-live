import {
  checkSellPayload,
  checkSwapPayload,
  type DecodedSellPayload,
  type DecodedSwapPayload,
  type SellPayloadCheckInput,
  type SwapPayloadCheckInput,
  type SwapPayloadIssueCode,
  swapPayloadFormatOf,
} from "@ledgerhq/hw-app-exchange";

export type PartnerPublicKey = SwapPayloadCheckInput["partnerPublicKey"];
export type Curve = PartnerPublicKey["curve"];
export type TransactionType = "swap" | "sell";
type SwapFormat = NonNullable<SwapPayloadCheckInput["format"]>;
export type SwapFormatChoice = "auto" | SwapFormat;
export type CalEnv = "prod" | "test";
export type KeySource = "provider" | "custom";

type PayloadKind = "swapNg" | "swapLegacy" | "sellNg";
type ModeKind = PayloadKind | "swapUndetermined";

export const CURVES: Curve[] = ["secp256k1", "secp256r1"];

export const DEVICE_SIDE_CHECKS_NOTE =
  "Fee size, address ownership and coin app checks still happen on the device.";

type Parsed<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

const HEX_PATTERN = /^[0-9a-fA-F]*$/;
const EVEN_HEX_PAYLOAD_PATTERN = /^(0x)?([0-9a-fA-F]{2})+$/i;
const NG_NONCE_PATTERN = /^[0-9a-fA-F]{64}$/;
const LEGACY_NONCE_PATTERN = /^[\x20-\x7e]{10}$/;
const INTEGER_PATTERN = /^\d+$/;

const stripHexPrefix = (value: string) => value.replace(/^0x/i, "");

export function parsePublicKeyHex(input: string): Parsed<Uint8Array> {
  const hex = stripHexPrefix(input.replace(/\s+/g, ""));

  if (!hex) return { error: "Enter the partner public key in hex." };
  if (!HEX_PATTERN.test(hex))
    return { error: "Only hexadecimal characters (0-9, a-f) are allowed." };
  if (hex.length % 2 !== 0) return { error: "Hex must have an even number of characters." };

  return { value: Uint8Array.from(hex.match(/../g) ?? [], byte => Number.parseInt(byte, 16)) };
}

type SwapExpectedValues = NonNullable<SwapPayloadCheckInput["expected"]>;
type SellExpectedValues = NonNullable<SellPayloadCheckInput["expected"]>;
type ExpectedValues = SwapExpectedValues | SellExpectedValues;
export type ExpectedValueKey = keyof SwapExpectedValues | keyof SellExpectedValues;
export type ExpectedForm = Partial<Record<ExpectedValueKey, string>>;

export function checkPayload(
  kind: ModeKind,
  input: {
    payload: string;
    signature: string;
    partnerPublicKey: PartnerPublicKey;
    expected?: ExpectedValues;
  },
) {
  if (kind === "sellNg") return checkSellPayload(input);
  return checkSwapPayload({ ...input, format: kind === "swapLegacy" ? "legacy" : "ng" });
}

type IssueCodes = readonly { code: SwapPayloadIssueCode }[];

const DECODE_FAILURES: ReadonlySet<SwapPayloadIssueCode> = new Set([
  "INVALID_ENCODING",
  "PROTOBUF_DECODE_FAILED",
]);
// Protobuf decoding is lenient across message types: the required fields tell them apart.
const STRUCTURE_FAILURES: ReadonlySet<SwapPayloadIssueCode> = new Set([
  ...DECODE_FAILURES,
  "MISSING_FIELD",
]);

const hasIssueIn = (issues: IssueCodes, codes: ReadonlySet<SwapPayloadIssueCode>) =>
  issues.some(({ code }) => codes.has(code));

const NO_PUBLIC_KEY: PartnerPublicKey = { curve: "secp256k1", data: new Uint8Array() };

const payloadIssuesAs = (kind: PayloadKind, payload: string) =>
  checkPayload(kind, { payload, signature: "", partnerPublicKey: NO_PUBLIC_KEY }).issues;

const decodesAs = (kind: PayloadKind, payload: string) =>
  !hasIssueIn(payloadIssuesAs(kind, payload), DECODE_FAILURES);

const looksLike = (kind: PayloadKind, payload: string) =>
  !hasIssueIn(payloadIssuesAs(kind, payload), STRUCTURE_FAILURES);

const isEvenHex = (payload: string) => EVEN_HEX_PAYLOAD_PATTERN.test(payload);

const isLegacySwapHex = (payload: string) =>
  isEvenHex(payload) && decodesAs("swapLegacy", stripHexPrefix(payload));

const providerFormatOf = (provider: { version?: number } | null): SwapFormat | null =>
  provider ? swapPayloadFormatOf(provider.version) : null;

const FORMAT_LABELS: Record<SwapFormat, string> = { ng: "NG", legacy: "Legacy" };
const FORMAT_NAMES: Record<SwapFormat, string> = { ng: "NG (base64url)", legacy: "Legacy (hex)" };

type InputLabels = { payload: string; signature: string; nonce: string };

const INPUT_LABELS: Record<ModeKind, InputLabels> = {
  swapNg: {
    payload: "Payload (base64url NewTransactionResponse)",
    signature: "Signature (base64url, 64-byte r||s)",
    nonce: "Nonce (device_transaction_id_ng, hex)",
  },
  swapLegacy: {
    payload: "Payload (hex NewTransactionResponse, no 0x prefix)",
    signature: "Signature (128 hex characters, 64-byte r||s)",
    nonce: "Nonce (device_transaction_id, 10 characters)",
  },
  swapUndetermined: {
    payload: "Payload (base64url or hex NewTransactionResponse)",
    signature: "Signature (base64url, or 128 hex characters for legacy)",
    nonce: "Nonce (64 hex characters, or 10 characters for legacy)",
  },
  sellNg: {
    payload: "Payload (base64url NewSellResponse)",
    signature: "Signature (base64url, 64-byte r||s)",
    nonce: "Nonce (device_transaction_id, hex)",
  },
};

type ExpectedInput = { key: ExpectedValueKey; label: string };

const EXPECTED_INPUTS: Record<TransactionType, ExpectedInput[]> = {
  swap: [
    { key: "currencyFrom", label: "currency_from" },
    { key: "currencyTo", label: "currency_to" },
    { key: "amountToProvider", label: "amount_to_provider (smallest unit)" },
    { key: "amountToWallet", label: "amount_to_wallet (smallest unit)" },
    { key: "payinAddress", label: "payin_address" },
    { key: "payoutAddress", label: "payout_address" },
    { key: "refundAddress", label: "refund_address" },
  ],
  sell: [
    { key: "inCurrency", label: "in_currency" },
    { key: "inAmount", label: "in_amount (smallest unit)" },
    { key: "inAddress", label: "in_address" },
    { key: "outCurrency", label: "out_currency" },
  ],
};

export type ModeTexts = {
  labels: InputLabels;
  expectedInputs: ExpectedInput[];
  transactionHelper: string | null;
  swapFormatWarning: string | null;
  sellProviderNotice: string | null;
  calEnvHelper: string;
  providerListNote: string | null;
};

type ModeInputs = {
  transactionType: TransactionType;
  swapFormatChoice: SwapFormatChoice;
  provider: { version?: number } | null;
  payload: string;
};

function swapFormatOf(
  choice: SwapFormatChoice,
  providerFormat: SwapFormat | null,
  payload: string,
): SwapFormat | null {
  if (choice !== "auto") return choice;
  if (providerFormat) return providerFormat;
  if (!payload) return null;
  return isLegacySwapHex(payload) ? "legacy" : "ng";
}

function swapTransactionHelper(
  choice: SwapFormatChoice,
  providerFormat: SwapFormat | null,
  swapFormat: SwapFormat | null,
): string | null {
  if (choice !== "auto") return null;
  if (providerFormat) return `Format from provider: ${FORMAT_NAMES[providerFormat]}.`;
  if (swapFormat) return `Detected format: ${FORMAT_NAMES[swapFormat]}.`;
  return "Auto uses the format of the selected Ledger provider (its CAL version). With a custom key, an even-length hex payload that decodes as a NewTransactionResponse is checked as legacy, anything else as NG.";
}

function swapFormatWarning(
  choice: SwapFormatChoice,
  providerFormat: SwapFormat | null,
): string | null {
  if (choice === "auto" || !providerFormat || choice === providerFormat) return null;
  return `The selected provider is a ${FORMAT_LABELS[providerFormat]} swap partner in CAL: Ledger Live will send its payload as ${FORMAT_LABELS[providerFormat]}, not ${FORMAT_LABELS[choice]}.`;
}

const textsFor = (
  kind: ModeKind,
  transactionType: TransactionType,
  texts: Omit<ModeTexts, "labels" | "expectedInputs">,
): ModeTexts => ({
  labels: INPUT_LABELS[kind],
  expectedInputs: [
    { key: "deviceTransactionId", label: INPUT_LABELS[kind].nonce },
    ...EXPECTED_INPUTS[transactionType],
  ],
  ...texts,
});

/**
 * Resolves what the selected type, format, provider and payload mean: the kind of payload to check
 * ("swapUndetermined" in Auto with neither a provider nor a payload) and the texts that depend on it.
 */
export function resolveMode({ transactionType, swapFormatChoice, provider, payload }: ModeInputs): {
  kind: ModeKind;
  texts: ModeTexts;
} {
  const providerFormat = providerFormatOf(provider);

  if (transactionType === "sell") {
    return {
      kind: "sellNg",
      texts: textsFor("sellNg", "sell", {
        transactionHelper:
          "Sell payloads are checked as Sell NG (base64url NewSellResponse, JWS-style signature).",
        swapFormatWarning: null,
        sellProviderNotice:
          providerFormat === "legacy"
            ? "This provider is a legacy Sell partner in CAL (version 1): Ledger Live uses the legacy Sell flow for it, which this tool does not support. Only Sell NG (version 2) payloads can be checked here."
            : null,
        calEnvHelper:
          "Partner keys registered in the selected CAL environment. Test lists the partners still in integration.",
        providerListNote: null,
      }),
    };
  }

  const swapFormat = swapFormatOf(swapFormatChoice, providerFormat, payload);
  const kind: ModeKind =
    swapFormat === null ? "swapUndetermined" : swapFormat === "legacy" ? "swapLegacy" : "swapNg";
  return {
    kind,
    texts: textsFor(kind, "swap", {
      transactionHelper: swapTransactionHelper(swapFormatChoice, providerFormat, swapFormat),
      swapFormatWarning: swapFormatWarning(swapFormatChoice, providerFormat),
      sellProviderNotice: null,
      calEnvHelper:
        "Swap provider keys come from the production CAL only: live-common reads the swap environment from global settings. To check a payload signed with a test key, use Custom key.",
      providerListNote:
        "Only CEX providers are listed. DEX swaps (1inch, Paraswap, Velora, OKX, Uniswap) call a router contract without a signed partner payload, so this checker does not apply to them.",
    }),
  };
}

const NG_NONCE_ERROR = "The nonce must be 64 hex characters (32 bytes).";
const LEGACY_NONCE_ERROR = "The legacy nonce must be exactly 10 printable ASCII characters.";
const ANY_NONCE_ERROR =
  "The nonce must be 64 hex characters (32 bytes), or exactly 10 printable ASCII characters for legacy.";

function parseNonce(input: string, kind: ModeKind): Parsed<string> {
  const hex = stripHexPrefix(input);
  const ngNonce = NG_NONCE_PATTERN.test(hex) ? hex : null;
  const legacyNonce = LEGACY_NONCE_PATTERN.test(input) ? input : null;

  if (kind === "swapLegacy")
    return legacyNonce ? { value: legacyNonce } : { error: LEGACY_NONCE_ERROR };
  if (kind === "swapUndetermined") {
    const nonce = ngNonce ?? legacyNonce;
    return nonce ? { value: nonce } : { error: ANY_NONCE_ERROR };
  }
  return ngNonce ? { value: ngNonce } : { error: NG_NONCE_ERROR };
}

const parseAmount = (input: string): Parsed<bigint> =>
  INTEGER_PATTERN.test(input)
    ? { value: BigInt(input) }
    : { error: "Enter an integer in the currency's smallest unit (no decimals, no sign)." };

const AMOUNT_KEYS: ReadonlySet<ExpectedValueKey> = new Set([
  "amountToProvider",
  "amountToWallet",
  "inAmount",
]);

export function parseExpectedValues(
  form: ExpectedForm,
  kind: ModeKind,
): { expected?: ExpectedValues; errors: ExpectedForm } {
  const expected: Partial<Record<ExpectedValueKey, string | bigint>> = {};
  const errors: ExpectedForm = {};

  for (const [key, input] of Object.entries(form) as [ExpectedValueKey, string][]) {
    const value = input.trim();
    if (!value) continue;

    const parsed: Parsed<string | bigint> =
      key === "deviceTransactionId"
        ? parseNonce(value, kind)
        : AMOUNT_KEYS.has(key)
          ? parseAmount(value)
          : { value };
    if (parsed.error === undefined) expected[key] = parsed.value;
    else errors[key] = parsed.error;
  }

  return {
    expected: Object.keys(expected).length > 0 ? (expected as ExpectedValues) : undefined,
    errors,
  };
}

export function expectedValuesToggleLabel(setCount: number, errorCount: number): string {
  const parts = [
    "optional",
    ...(setCount > 0 ? [`${setCount} set`] : []),
    ...(errorCount > 0 ? [`${errorCount} invalid`] : []),
  ];
  return `Expected values (${parts.join(", ")})`;
}

export type DecodedField = { field: string; value: string };

type DecodedKey = keyof DecodedSwapPayload | keyof DecodedSellPayload;

const DECODED_KEYS_IN_ORDER: DecodedKey[] = [
  "payinAddress",
  "payinExtraId",
  "payinExtraData",
  "refundAddress",
  "refundExtraId",
  "payoutAddress",
  "payoutExtraId",
  "currencyFrom",
  "currencyTo",
  "amountToProvider",
  "amountToWallet",
  "message",
  "traderEmail",
  "inCurrency",
  "inAmount",
  "inAddress",
  "inExtraId",
  "outCurrency",
  "outAmount",
  "deviceTransactionId",
  "deviceTransactionIdNg",
];

const toProtobufFieldName = (key: string) =>
  key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export function formatDecodedFields(
  decoded: DecodedSwapPayload | DecodedSellPayload,
): DecodedField[] {
  const values: Partial<Record<DecodedKey, unknown>> = decoded;
  return DECODED_KEYS_IN_ORDER.flatMap(key => {
    const value = values[key];
    if (value === undefined || value === null) return [];
    return [{ field: toProtobufFieldName(key), value: value === "" ? "(empty)" : String(value) }];
  });
}

export type ProviderOption = {
  value: string;
  label: string;
  publicKey: PartnerPublicKey;
  version?: number;
};

type ProviderConfig = {
  type?: "CEX" | "DEX";
  name?: string;
  displayName?: string;
  publicKey?: PartnerPublicKey;
  version?: number;
};

export function toProviderOptions(
  transactionType: TransactionType,
  configs: Record<string, ProviderConfig | null | undefined>,
): ProviderOption[] {
  return Object.entries(configs)
    .flatMap(([id, config]) => {
      if (!config?.publicKey) return [];
      if (transactionType === "swap" && config.type !== "CEX") return [];
      const name = config.displayName ?? config.name ?? id;
      return [
        {
          value: id,
          label: name === id ? id : `${name} (${id})`,
          publicKey: config.publicKey,
          version: config.version,
        },
      ];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export type ProvidersState =
  | { status: "loading" }
  | { status: "ready"; options: ProviderOption[] }
  | { status: "error"; message: string };

export type ProviderHelper = { text: string; failed: boolean };

export function providerHelperOf(
  providers: ProvidersState,
  transactionType: TransactionType,
): ProviderHelper | null {
  if (providers.status === "loading") return { text: "Loading providers...", failed: false };
  if (providers.status === "error") {
    return { text: `Could not load providers: ${providers.message}`, failed: true };
  }
  if (providers.options.length === 0) {
    return {
      text: `No ${transactionType} provider with a public key in this CAL environment.`,
      failed: false,
    };
  }
  return null;
}

export type ModeHint = {
  message: string;
  actionLabel: string;
  switchTo: { transactionType: TransactionType; swapFormatChoice?: SwapFormat };
};

function swapFormatHint(
  format: SwapFormat,
  provider: ModeInputs["provider"],
  message: string,
): ModeHint {
  const providerFormat = providerFormatOf(provider);
  const autoPicksThisFormat = !providerFormat || providerFormat === format;
  return {
    message: `${message} Switch Payload format to ${FORMAT_LABELS[format]}${autoPicksThisFormat ? " or Auto" : ""}.`,
    actionLabel: `Switch to ${FORMAT_LABELS[format]}`,
    switchTo: { transactionType: "swap", swapFormatChoice: format },
  };
}

function swapModeHint(
  { swapFormatChoice, provider, payload }: ModeInputs,
  issues: IssueCodes,
): ModeHint | null {
  if (looksLike("sellNg", payload)) {
    return {
      message: "This looks like a Sell payload (NewSellResponse). Switch Transaction type to Sell.",
      actionLabel: "Switch to Sell",
      switchTo: { transactionType: "sell" },
    };
  }
  if (
    swapFormatChoice === "legacy" &&
    issues.some(({ code }) => code === "INVALID_ENCODING") &&
    !isEvenHex(payload) &&
    decodesAs("swapNg", payload)
  ) {
    return swapFormatHint(
      "ng",
      provider,
      "This looks like a Swap NG payload (base64url), not a legacy hex payload.",
    );
  }
  if (swapFormatChoice === "ng" && isLegacySwapHex(payload)) {
    return swapFormatHint(
      "legacy",
      provider,
      "This looks like a legacy Swap payload (hex NewTransactionResponse).",
    );
  }
  return null;
}

function sellModeHint({ swapFormatChoice, payload }: ModeInputs): ModeHint | null {
  const swapFormat: SwapFormat | null = looksLike("swapNg", payload)
    ? "ng"
    : isEvenHex(payload) && looksLike("swapLegacy", stripHexPrefix(payload))
      ? "legacy"
      : null;
  if (!swapFormat) return null;

  const keptChoiceRejectsPayload = swapFormatChoice !== "auto" && swapFormatChoice !== swapFormat;
  return {
    message: "This looks like a Swap payload. Switch Transaction type to Swap.",
    actionLabel: "Switch to Swap",
    switchTo: {
      transactionType: "swap",
      swapFormatChoice: keptChoiceRejectsPayload ? swapFormat : undefined,
    },
  };
}

export function modeMismatchHint(inputs: ModeInputs, issues: IssueCodes): ModeHint | null {
  if (!inputs.payload || !hasIssueIn(issues, STRUCTURE_FAILURES)) return null;
  return inputs.transactionType === "sell" ? sellModeHint(inputs) : swapModeHint(inputs, issues);
}

export function pendingReasonOf({
  payload,
  signature,
  hasPartnerPublicKey,
  keySource,
  sellProviderNotice,
  hasExpectedErrors,
}: {
  payload: string;
  signature: string;
  hasPartnerPublicKey: boolean;
  keySource: KeySource;
  sellProviderNotice: string | null;
  hasExpectedErrors: boolean;
}): string | null {
  if (sellProviderNotice) return sellProviderNotice;
  if (!payload) return "Paste a payload to check it.";
  if (!signature) return "Paste the signature to check the payload.";
  if (!hasPartnerPublicKey) {
    return keySource === "custom" ? "Enter a valid partner public key." : "Select a provider.";
  }
  if (hasExpectedErrors) return "Fix the expected values to run the check.";
  return null;
}

export type ResultBanner = {
  appearance: "error" | "warning" | "success";
  title: string;
  description: string;
};

const countOf = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export function resultBanner(report: {
  valid: boolean;
  issues: { severity: "error" | "warning" }[];
}): ResultBanner {
  const errors = report.issues.filter(issue => issue.severity === "error").length;
  const warnings = report.issues.length - errors;
  const passes =
    "Passes the payload and signature checks performed by Ledger Live and the Exchange app";

  if (!report.valid) {
    return {
      appearance: "error",
      title: "Invalid",
      description: `${countOf(errors, "error")} found. The payload would be rejected by Ledger Live or the Exchange app, or does not match the values or key you provided.`,
    };
  }
  if (warnings > 0) {
    return {
      appearance: "warning",
      title: "Valid, with warnings",
      description: `${passes}, but read the ${countOf(warnings, "warning")} below. ${DEVICE_SIDE_CHECKS_NOTE}`,
    };
  }
  return {
    appearance: "success",
    title: "Valid",
    description: `${passes}. ${DEVICE_SIDE_CHECKS_NOTE}`,
  };
}
