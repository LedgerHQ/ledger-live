/**
 * @jest-environment node
 */
import {
  checkPayload,
  expectedValuesToggleLabel,
  formatDecodedFields,
  modeMismatchHint,
  parseExpectedValues,
  parsePublicKeyHex,
  pendingReasonOf,
  providerHelperOf,
  resolveMode,
  resultBanner,
  toProviderOptions,
  type SwapFormatChoice,
  type TransactionType,
} from "./logic";

const NONCE = "ab".repeat(32);
const LEGACY_NONCE = "OtXpAvlovk";

/** A length-delimited protobuf field (wire type 2) holding an ASCII string. */
const stringField = (fieldNumber: number, value: string) => [
  (fieldNumber << 3) | 2,
  value.length,
  ...Array.from(value, char => char.charCodeAt(0)),
];

const toHex = (bytes: number[]) => bytes.map(byte => byte.toString(16).padStart(2, "0")).join("");

// NewTransactionResponse with payin_address (1) and device_transaction_id (11).
const LEGACY_PAYLOAD_HEX = toHex([...stringField(1, "abc"), ...stringField(11, LEGACY_NONCE)]);

const bytesField = (fieldNumber: number, bytes: number[]) => [
  (fieldNumber << 3) | 2,
  bytes.length,
  ...bytes,
];

const NONCE_BYTES = Array.from({ length: 32 }, () => 0xab);

const SWAP_REQUIRED_FIELDS = [
  ...stringField(1, "payin"),
  ...stringField(3, "refund"),
  ...stringField(5, "payout"),
  ...stringField(7, "BTC"),
  ...stringField(8, "ETH"),
  ...bytesField(9, [0x01]),
  ...bytesField(10, [0x02]),
];
const SWAP_NG_PAYLOAD = Buffer.from([
  ...SWAP_REQUIRED_FIELDS,
  ...bytesField(12, NONCE_BYTES),
]).toString("base64url");
const SWAP_LEGACY_PAYLOAD = toHex([...SWAP_REQUIRED_FIELDS, ...stringField(11, LEGACY_NONCE)]);

// NewSellResponse: trader_email (1), in_currency (2), in_amount (3), in_address (4),
// out_currency (5), out_amount (6, UDecimal with coefficient 1) and device_transaction_id (7).
const SELL_PAYLOAD = Buffer.from([
  ...stringField(1, "trader@example.com"),
  ...stringField(2, "ETH"),
  ...bytesField(3, [0x01]),
  ...stringField(4, "0xabc"),
  ...stringField(5, "EUR"),
  ...bytesField(6, bytesField(1, [0x01])),
  ...bytesField(7, NONCE_BYTES),
]).toString("base64url");

type Provider = { version?: number } | null;

const swapMode = (swapFormatChoice: SwapFormatChoice, payload = "", provider: Provider = null) =>
  resolveMode({ transactionType: "swap", swapFormatChoice, provider, payload });

const sellMode = (provider: Provider = null) =>
  resolveMode({ transactionType: "sell", swapFormatChoice: "auto", provider, payload: "" });

const LEGACY_PROVIDER = { version: 1 };
const NG_PROVIDER = { version: 2 };

describe("parsePublicKeyHex", () => {
  it("parses hex into bytes", () => {
    expect(parsePublicKeyHex("04a1ff").value).toEqual(new Uint8Array([0x04, 0xa1, 0xff]));
  });

  it("accepts a 0x prefix, upper case and whitespace", () => {
    expect(parsePublicKeyHex(" 0x04A1\nFF ").value).toEqual(new Uint8Array([0x04, 0xa1, 0xff]));
  });

  it("rejects an empty input", () => {
    expect(parsePublicKeyHex("  ").error).toBeDefined();
  });

  it("rejects non hex characters", () => {
    expect(parsePublicKeyHex("04zz").error).toMatch(/hexadecimal/);
  });

  it("rejects an odd number of characters", () => {
    expect(parsePublicKeyHex("04a").error).toMatch(/even/);
  });
});

describe("resolveMode", () => {
  describe("swap payload kind", () => {
    it("detects an even-length hex payload that decodes as legacy", () => {
      expect(swapMode("auto", LEGACY_PAYLOAD_HEX).kind).toBe("swapLegacy");
      expect(swapMode("auto", LEGACY_PAYLOAD_HEX.toUpperCase()).kind).toBe("swapLegacy");
      expect(swapMode("auto", `0x${LEGACY_PAYLOAD_HEX}`).kind).toBe("swapLegacy");
    });

    it("falls back to NG for base64url payloads", () => {
      const base64url = Buffer.from(LEGACY_PAYLOAD_HEX, "hex").toString("base64url");
      expect(swapMode("auto", base64url).kind).toBe("swapNg");
      expect(swapMode("auto", `.${base64url}`).kind).toBe("swapNg");
    });

    it("falls back to NG for odd-length hex and hex that is not a protobuf message", () => {
      expect(swapMode("auto", LEGACY_PAYLOAD_HEX.slice(0, -1)).kind).toBe("swapNg");
      expect(swapMode("auto", "ffff").kind).toBe("swapNg");
    });

    it("is undetermined in auto without a provider nor a payload", () => {
      expect(swapMode("auto").kind).toBe("swapUndetermined");
    });

    it("keeps an explicit choice", () => {
      expect(swapMode("ng", LEGACY_PAYLOAD_HEX).kind).toBe("swapNg");
      expect(swapMode("legacy", "not-hex").kind).toBe("swapLegacy");
      expect(swapMode("legacy").kind).toBe("swapLegacy");
    });

    it("uses the provider format in auto mode instead of detecting it from the payload", () => {
      const base64url = Buffer.from(LEGACY_PAYLOAD_HEX, "hex").toString("base64url");
      expect(swapMode("auto", base64url, LEGACY_PROVIDER).kind).toBe("swapLegacy");
      expect(swapMode("auto", LEGACY_PAYLOAD_HEX, NG_PROVIDER).kind).toBe("swapNg");
      expect(swapMode("auto", "", NG_PROVIDER).kind).toBe("swapNg");
    });

    it("keeps an explicit choice over the provider format", () => {
      expect(swapMode("ng", LEGACY_PAYLOAD_HEX, LEGACY_PROVIDER).kind).toBe("swapNg");
      expect(swapMode("legacy", "", NG_PROVIDER).kind).toBe("swapLegacy");
    });

    it.each([
      [2, "swapNg"],
      [3, "swapNg"],
      [1, "swapLegacy"],
      [undefined, "swapLegacy"],
    ] as const)(
      "follows a provider with CAL version %p as %s, like createExchange",
      (version, kind) => {
        expect(swapMode("auto", "", { version }).kind).toBe(kind);
      },
    );
  });

  it("checks every Sell payload as Sell NG", () => {
    expect(sellMode().kind).toBe("sellNg");
    expect(
      resolveMode({
        transactionType: "sell",
        swapFormatChoice: "legacy",
        provider: LEGACY_PROVIDER,
        payload: LEGACY_PAYLOAD_HEX,
      }).kind,
    ).toBe("sellNg");
  });

  describe("swap format warning", () => {
    it("warns when the chosen format contradicts the provider", () => {
      expect(swapMode("ng", "", LEGACY_PROVIDER).texts.swapFormatWarning).toMatch(
        /Legacy swap partner/,
      );
      expect(swapMode("legacy", "", NG_PROVIDER).texts.swapFormatWarning).toMatch(
        /NG swap partner/,
      );
    });

    it("does not warn in auto mode, without a provider, when the formats match or for Sell", () => {
      expect(swapMode("auto", "", LEGACY_PROVIDER).texts.swapFormatWarning).toBeNull();
      expect(swapMode("ng").texts.swapFormatWarning).toBeNull();
      expect(swapMode("ng", "", NG_PROVIDER).texts.swapFormatWarning).toBeNull();
      expect(swapMode("legacy", "", LEGACY_PROVIDER).texts.swapFormatWarning).toBeNull();
      expect(sellMode(LEGACY_PROVIDER).texts.swapFormatWarning).toBeNull();
    });
  });

  describe("legacy Sell provider notice", () => {
    it("explains that a legacy Sell provider is not supported", () => {
      expect(sellMode(LEGACY_PROVIDER).texts.sellProviderNotice).toMatch(
        /legacy Sell .* not support/,
      );
      expect(sellMode({}).texts.sellProviderNotice).toMatch(/legacy Sell .* not support/);
    });

    it("stays silent for a Sell NG provider, without a provider and for Swap", () => {
      expect(sellMode(NG_PROVIDER).texts.sellProviderNotice).toBeNull();
      expect(sellMode().texts.sellProviderNotice).toBeNull();
      expect(swapMode("auto", "", LEGACY_PROVIDER).texts.sellProviderNotice).toBeNull();
    });
  });

  describe("transaction helper", () => {
    it("describes Sell as Sell NG", () => {
      expect(sellMode().texts.transactionHelper).toMatch(/Sell NG/);
    });

    it("is empty when the swap format is picked by hand", () => {
      expect(swapMode("ng").texts.transactionHelper).toBeNull();
    });

    it("names the provider format first, then the detected one", () => {
      expect(swapMode("auto", SWAP_NG_PAYLOAD, LEGACY_PROVIDER).texts.transactionHelper).toBe(
        "Format from provider: Legacy (hex).",
      );
      expect(swapMode("auto", SWAP_NG_PAYLOAD).texts.transactionHelper).toBe(
        "Detected format: NG (base64url).",
      );
    });

    it("explains how auto works while nothing is known", () => {
      expect(swapMode("auto").texts.transactionHelper).toMatch(/^Auto uses/);
    });
  });

  describe("input labels", () => {
    it("uses neutral labels in swap auto mode without a provider or a payload", () => {
      const { labels } = swapMode("auto").texts;
      expect(labels.payload).toBe("Payload (base64url or hex NewTransactionResponse)");
      expect(labels.signature).toBe("Signature (base64url, or 128 hex characters for legacy)");
      expect(labels.nonce).toMatch(/64 hex characters, or 10 characters for legacy/);
    });

    it("uses the NG labels once the format is detected as NG", () => {
      const { labels } = swapMode("auto", SWAP_NG_PAYLOAD).texts;
      expect(labels.payload).toBe("Payload (base64url NewTransactionResponse)");
      expect(labels.signature).toBe("Signature (base64url, 64-byte r||s)");
      expect(labels.nonce).toBe("Nonce (device_transaction_id_ng, hex)");
    });

    it("uses the legacy labels for a legacy provider", () => {
      const { labels } = swapMode("auto", "", LEGACY_PROVIDER).texts;
      expect(labels.payload).toMatch(/^Payload \(hex/);
      expect(labels.signature).toBe("Signature (128 hex characters, 64-byte r||s)");
      expect(labels.nonce).toBe("Nonce (device_transaction_id, 10 characters)");
    });

    it("uses the labels of the format picked by hand, even without a payload", () => {
      expect(swapMode("legacy").texts.labels.nonce).toBe(
        "Nonce (device_transaction_id, 10 characters)",
      );
    });

    it("uses the Sell NG labels for Sell", () => {
      const { labels } = sellMode().texts;
      expect(labels.payload).toBe("Payload (base64url NewSellResponse)");
      expect(labels.nonce).toBe("Nonce (device_transaction_id, hex)");
    });
  });

  describe("expected value inputs", () => {
    it("starts with the nonce, labelled for the format in use", () => {
      const { expectedInputs } = swapMode("legacy").texts;
      expect(expectedInputs[0]).toEqual({
        key: "deviceTransactionId",
        label: "Nonce (device_transaction_id, 10 characters)",
      });
      expect(expectedInputs.map(({ key }) => key)).toContain("payinAddress");
    });

    it("lists the Sell fields for Sell", () => {
      expect(sellMode().texts.expectedInputs.map(({ key }) => key)).toEqual([
        "deviceTransactionId",
        "inCurrency",
        "inAmount",
        "inAddress",
        "outCurrency",
      ]);
    });
  });

  describe("provider texts", () => {
    it("explains that swap keys come from the production CAL and points to Custom key", () => {
      expect(swapMode("auto").texts.calEnvHelper).toMatch(/production CAL only.*Custom key/);
    });

    it("describes the test environment for Sell", () => {
      expect(sellMode().texts.calEnvHelper).toMatch(/Test lists the partners/);
    });

    it("explains why DEX providers are not listed for Swap", () => {
      expect(swapMode("auto").texts.providerListNote).toMatch(
        /^Only CEX providers are listed\. DEX swaps \(1inch/,
      );
    });

    it("has no provider list note for Sell", () => {
      expect(sellMode().texts.providerListNote).toBeNull();
    });
  });
});

describe("parseExpectedValues", () => {
  it("returns no expected values when every input is empty", () => {
    expect(parseExpectedValues({}, "swapNg")).toEqual({ expected: undefined, errors: {} });
    expect(parseExpectedValues({ currencyFrom: "  ", inAmount: "" }, "swapNg")).toEqual({
      expected: undefined,
      errors: {},
    });
  });

  it("keeps only the filled swap inputs, trimmed and typed", () => {
    const { expected, errors } = parseExpectedValues(
      {
        deviceTransactionId: ` 0x${NONCE.toUpperCase()} `,
        currencyFrom: " BTC ",
        currencyTo: "",
        amountToProvider: "1000",
        payoutAddress: "0xabc",
      },
      "swapNg",
    );

    expect(errors).toEqual({});
    expect(expected).toEqual({
      deviceTransactionId: NONCE.toUpperCase(),
      currencyFrom: "BTC",
      amountToProvider: 1000n,
      payoutAddress: "0xabc",
    });
  });

  it("parses an amount into a bigint, beyond the safe integer range", () => {
    expect(
      parseExpectedValues({ amountToWallet: " 123456789012345678901234567890 " }, "swapNg")
        .expected,
    ).toEqual({ amountToWallet: 123456789012345678901234567890n });
  });

  it.each(["1.5", "-1", "1e18", "0x10", "abc"])("rejects the amount %p", amount => {
    expect(
      parseExpectedValues({ amountToProvider: amount }, "swapNg").errors.amountToProvider,
    ).toMatch(/integer in the currency's smallest unit/);
  });

  it("reports invalid amounts and keeps the valid values", () => {
    const { expected, errors } = parseExpectedValues(
      { amountToProvider: "1.5", amountToWallet: "42" },
      "swapNg",
    );

    expect(errors).toEqual({ amountToProvider: expect.any(String) });
    expect(expected).toEqual({ amountToWallet: 42n });
  });

  it("reports an NG nonce that is not 32 bytes of hex", () => {
    const { expected, errors } = parseExpectedValues(
      { deviceTransactionId: "ab".repeat(31) },
      "swapNg",
    );

    expect(expected).toBeUndefined();
    expect(errors.deviceTransactionId).toMatch(/64 hex/);
  });

  it("keeps a legacy nonce as is", () => {
    const { expected, errors } = parseExpectedValues(
      { deviceTransactionId: ` ${LEGACY_NONCE} ` },
      "swapLegacy",
    );

    expect(errors).toEqual({});
    expect(expected).toEqual({ deviceTransactionId: LEGACY_NONCE });
  });

  it.each([LEGACY_NONCE.slice(0, 9), `${LEGACY_NONCE}x`, NONCE])(
    "reports a legacy nonce %p that is not 10 characters",
    nonce => {
      const { expected, errors } = parseExpectedValues(
        { deviceTransactionId: nonce },
        "swapLegacy",
      );

      expect(expected).toBeUndefined();
      expect(errors.deviceTransactionId).toMatch(/10 printable/);
    },
  );

  describe("while the auto format is undetermined", () => {
    it.each([
      ["an NG nonce", `0x${NONCE}`, NONCE],
      ["a legacy nonce", LEGACY_NONCE, LEGACY_NONCE],
    ])("accepts %s", (_case, nonce, value) => {
      const { expected, errors } = parseExpectedValues(
        { deviceTransactionId: nonce },
        "swapUndetermined",
      );

      expect(errors).toEqual({});
      expect(expected).toEqual({ deviceTransactionId: value });
    });

    it("reports a nonce that is neither NG nor legacy", () => {
      const { expected, errors } = parseExpectedValues(
        { deviceTransactionId: "ab".repeat(31) },
        "swapUndetermined",
      );

      expect(expected).toBeUndefined();
      expect(errors.deviceTransactionId).toMatch(/64 hex characters .* or exactly 10 printable/);
    });

    it("validates the nonce for the resolved format once it is known", () => {
      const form = { deviceTransactionId: LEGACY_NONCE };

      expect(parseExpectedValues(form, "swapNg").errors.deviceTransactionId).toMatch(/64 hex/);
      expect(parseExpectedValues(form, "swapLegacy").errors).toEqual({});
    });
  });

  it("keeps the filled Sell inputs, trimmed and typed", () => {
    const { expected, errors } = parseExpectedValues(
      {
        deviceTransactionId: `0X${NONCE}`,
        inCurrency: " ETH ",
        inAmount: "84380000000000000000",
        inAddress: "0xabc",
        outCurrency: "EUR",
      },
      "sellNg",
    );

    expect(errors).toEqual({});
    expect(expected).toEqual({
      deviceTransactionId: NONCE,
      inCurrency: "ETH",
      inAmount: 84380000000000000000n,
      inAddress: "0xabc",
      outCurrency: "EUR",
    });
  });

  it("reports an invalid Sell nonce and amount", () => {
    const { expected, errors } = parseExpectedValues(
      { deviceTransactionId: LEGACY_NONCE, inAmount: "84.38", outCurrency: "EUR" },
      "sellNg",
    );

    expect(errors).toEqual({
      deviceTransactionId: expect.any(String),
      inAmount: expect.any(String),
    });
    expect(expected).toEqual({ outCurrency: "EUR" });
  });
});

describe("expectedValuesToggleLabel", () => {
  it("shows how many values are set and invalid", () => {
    expect(expectedValuesToggleLabel(0, 0)).toBe("Expected values (optional)");
    expect(expectedValuesToggleLabel(2, 0)).toBe("Expected values (optional, 2 set)");
    expect(expectedValuesToggleLabel(0, 1)).toBe("Expected values (optional, 1 invalid)");
    expect(expectedValuesToggleLabel(2, 1)).toBe("Expected values (optional, 2 set, 1 invalid)");
  });
});

describe("formatDecodedFields", () => {
  it("lists swap protobuf field names with amounts as integer strings, skipping absent fields", () => {
    const fields = formatDecodedFields({
      payinAddress: "payin",
      payinExtraId: "",
      refundAddress: "refund",
      payoutAddress: "payout",
      currencyFrom: "BTC",
      currencyTo: "ETH",
      amountToProvider: 123456789012345678901234567890n,
      amountToWallet: 1n,
      deviceTransactionIdNg: NONCE,
    });

    expect(fields).toEqual([
      { field: "payin_address", value: "payin" },
      { field: "payin_extra_id", value: "(empty)" },
      { field: "refund_address", value: "refund" },
      { field: "payout_address", value: "payout" },
      { field: "currency_from", value: "BTC" },
      { field: "currency_to", value: "ETH" },
      { field: "amount_to_provider", value: "123456789012345678901234567890" },
      { field: "amount_to_wallet", value: "1" },
      { field: "device_transaction_id_ng", value: NONCE },
    ]);
  });

  it("shows payin_extra_data as hex after payin_extra_id", () => {
    const fields = formatDecodedFields({
      payinAddress: "payin",
      payinExtraData: "01cdcd",
      refundAddress: "refund",
      payoutAddress: "payout",
      currencyFrom: "BTC",
      currencyTo: "ETH",
      amountToProvider: 1n,
      amountToWallet: 1n,
    });

    expect(fields.slice(0, 2)).toEqual([
      { field: "payin_address", value: "payin" },
      { field: "payin_extra_data", value: "01cdcd" },
    ]);
  });

  it("shows the legacy nonce string", () => {
    expect(
      formatDecodedFields({
        payinAddress: "payin",
        refundAddress: "refund",
        payoutAddress: "payout",
        currencyFrom: "BTC",
        currencyTo: "ETH",
        amountToProvider: 1n,
        amountToWallet: 1n,
        deviceTransactionId: LEGACY_NONCE,
      }),
    ).toContainEqual({ field: "device_transaction_id", value: LEGACY_NONCE });
  });

  it("lists Sell protobuf field names, in_amount as an integer and out_amount as a decimal", () => {
    expect(
      formatDecodedFields({
        traderEmail: "trader@example.com",
        inCurrency: "ETH",
        inAmount: 123456789012345678901234567890n,
        inAddress: "0xabc",
        outCurrency: "EUR",
        outAmount: "84.38",
        deviceTransactionId: NONCE,
      }),
    ).toEqual([
      { field: "trader_email", value: "trader@example.com" },
      { field: "in_currency", value: "ETH" },
      { field: "in_amount", value: "123456789012345678901234567890" },
      { field: "in_address", value: "0xabc" },
      { field: "out_currency", value: "EUR" },
      { field: "out_amount", value: "84.38" },
      { field: "device_transaction_id", value: NONCE },
    ]);
  });
});

describe("toProviderOptions", () => {
  const publicKey = { curve: "secp256k1" as const, data: new Uint8Array([0x04, 0x01]) };

  const optionOf = (
    transactionType: TransactionType,
    id: string,
    config: Parameters<typeof toProviderOptions>[1][string],
  ) => toProviderOptions(transactionType, { [id]: config })[0] ?? null;

  it("maps a CEX swap provider with a public key", () => {
    expect(optionOf("swap", "changelly_v2", { type: "CEX", name: "Changelly", publicKey })).toEqual(
      { value: "changelly_v2", label: "Changelly (changelly_v2)", publicKey },
    );
  });

  it("prefers the display name and does not repeat an identical id", () => {
    expect(optionOf("swap", "exodus", { type: "CEX", name: "exodus", publicKey })?.label).toBe(
      "exodus",
    );
    expect(
      optionOf("swap", "cic", { type: "CEX", name: "CIC", displayName: "CIC Exchange", publicKey })
        ?.label,
    ).toBe("CIC Exchange (cic)");
  });

  it("drops DEX swap providers and providers without a public key", () => {
    expect(optionOf("swap", "oneinch", { type: "DEX", publicKey })).toBeNull();
    expect(optionOf("swap", "thorswap", { type: "CEX", name: "thorswap" })).toBeNull();
    expect(optionOf("sell", "nokey", { name: "No key" })).toBeNull();
    expect(optionOf("sell", "broken", null)).toBeNull();
  });

  it("keeps the CAL version", () => {
    expect(
      optionOf("swap", "changelly", { type: "CEX", name: "Changelly", publicKey, version: 1 })
        ?.version,
    ).toBe(1);
    expect(optionOf("sell", "coinify", { name: "Coinify", publicKey, version: 2 })).toEqual({
      value: "coinify",
      label: "Coinify (coinify)",
      publicKey,
      version: 2,
    });
  });

  it("maps a sell provider, which has no type", () => {
    expect(optionOf("sell", "nimbus", { name: "Nimbus", publicKey })).toEqual({
      value: "nimbus",
      label: "Nimbus (nimbus)",
      publicKey,
    });
  });

  it("keeps the providers with a key, sorted by label", () => {
    expect(
      toProviderOptions("sell", {
        zeta: { name: "Zeta", publicKey },
        alpha: { name: "Alpha", publicKey },
        broken: null,
        nokey: { name: "No key" },
      }).map(option => option.value),
    ).toEqual(["alpha", "zeta"]);
  });
});

describe("providerHelperOf", () => {
  it("describes loading, errors and empty lists", () => {
    expect(providerHelperOf({ status: "loading" }, "swap")).toEqual({
      text: "Loading providers...",
      failed: false,
    });
    expect(providerHelperOf({ status: "error", message: "boom" }, "sell")).toEqual({
      text: "Could not load providers: boom",
      failed: true,
    });
    expect(providerHelperOf({ status: "ready", options: [] }, "sell")).toEqual({
      text: expect.stringMatching(/^No sell provider/),
      failed: false,
    });
  });

  it("is empty when providers are listed", () => {
    const option = {
      value: "changelly",
      label: "Changelly",
      publicKey: { curve: "secp256k1" as const, data: new Uint8Array() },
    };
    expect(providerHelperOf({ status: "ready", options: [option] }, "swap")).toBeNull();
  });
});

describe("modeMismatchHint", () => {
  const EMPTY_KEY = { curve: "secp256k1" as const, data: new Uint8Array() };

  const hintFor = (
    transactionType: TransactionType,
    swapFormatChoice: SwapFormatChoice,
    payload: string,
    provider: Provider = null,
  ) => {
    const inputs = { transactionType, swapFormatChoice, provider, payload };
    const { issues } = checkPayload(resolveMode(inputs).kind, {
      payload,
      signature: "",
      partnerPublicKey: EMPTY_KEY,
    });
    return modeMismatchHint(inputs, issues);
  };

  it.each<SwapFormatChoice>(["auto", "ng", "legacy"])(
    "suggests Sell for a Sell payload checked as a Swap (%s)",
    choice => {
      expect(hintFor("swap", choice, SELL_PAYLOAD)).toEqual({
        message:
          "This looks like a Sell payload (NewSellResponse). Switch Transaction type to Sell.",
        actionLabel: "Switch to Sell",
        switchTo: { transactionType: "sell" },
      });
    },
  );

  it.each<[string, string, SwapFormatChoice]>([
    ["an NG", SWAP_NG_PAYLOAD, "auto"],
    ["a legacy", SWAP_LEGACY_PAYLOAD, "auto"],
    ["a matching NG", SWAP_NG_PAYLOAD, "ng"],
  ])("suggests Swap for %s Swap payload checked as a Sell", (_case, payload, choice) => {
    expect(hintFor("sell", choice, payload)).toEqual({
      message: "This looks like a Swap payload. Switch Transaction type to Swap.",
      actionLabel: "Switch to Swap",
      switchTo: { transactionType: "swap" },
    });
  });

  it("switches to the format the Swap payload decodes as when the kept choice would reject it", () => {
    expect(hintFor("sell", "legacy", SWAP_NG_PAYLOAD)?.switchTo).toEqual({
      transactionType: "swap",
      swapFormatChoice: "ng",
    });
    expect(hintFor("sell", "ng", SWAP_LEGACY_PAYLOAD)?.switchTo).toEqual({
      transactionType: "swap",
      swapFormatChoice: "legacy",
    });
  });

  it("suggests NG or Auto for a base64url Swap payload checked as legacy", () => {
    expect(hintFor("swap", "legacy", SWAP_NG_PAYLOAD)).toEqual({
      message:
        "This looks like a Swap NG payload (base64url), not a legacy hex payload. Switch Payload format to NG or Auto.",
      actionLabel: "Switch to NG",
      switchTo: { transactionType: "swap", swapFormatChoice: "ng" },
    });
  });

  it("suggests Legacy or Auto for a hex Swap payload checked as NG", () => {
    expect(hintFor("swap", "ng", SWAP_LEGACY_PAYLOAD)).toEqual({
      message:
        "This looks like a legacy Swap payload (hex NewTransactionResponse). Switch Payload format to Legacy or Auto.",
      actionLabel: "Switch to Legacy",
      switchTo: { transactionType: "swap", swapFormatChoice: "legacy" },
    });
  });

  it("does not suggest Auto when it would follow a provider of the other format", () => {
    expect(hintFor("swap", "legacy", SWAP_NG_PAYLOAD, LEGACY_PROVIDER)?.message).toMatch(
      /Switch Payload format to NG\.$/,
    );
    expect(hintFor("swap", "legacy", SWAP_NG_PAYLOAD, NG_PROVIDER)?.message).toMatch(
      /to NG or Auto\.$/,
    );
  });

  it.each<[string, TransactionType, SwapFormatChoice, string, Provider]>([
    ["a Swap NG payload checked as NG", "swap", "ng", SWAP_NG_PAYLOAD, null],
    ["a legacy payload checked as legacy", "swap", "legacy", SWAP_LEGACY_PAYLOAD, null],
    ["a Sell payload checked as Sell", "sell", "auto", SELL_PAYLOAD, null],
    ["a format given by the provider in auto", "swap", "auto", SWAP_NG_PAYLOAD, LEGACY_PROVIDER],
    ["a garbage payload", "swap", "legacy", "not a payload!", null],
    ["a base64url payload that is neither", "sell", "auto", "AAAA", null],
    ["an empty payload", "swap", "auto", "", null],
  ])("stays silent for %s", (_case, transactionType, choice, payload, provider) => {
    expect(hintFor(transactionType, choice, payload, provider)).toBeNull();
  });

  it("stays silent when the check did not fail on decoding or required fields", () => {
    expect(
      modeMismatchHint(
        { transactionType: "swap", swapFormatChoice: "ng", provider: null, payload: SELL_PAYLOAD },
        [{ code: "SIGNATURE_INVALID" }],
      ),
    ).toBeNull();
  });
});

describe("pendingReasonOf", () => {
  const READY: Parameters<typeof pendingReasonOf>[0] = {
    payload: "payload",
    signature: "signature",
    hasPartnerPublicKey: true,
    keySource: "provider",
    sellProviderNotice: null,
    hasExpectedErrors: false,
  };

  it("lets the check run once everything is set", () => {
    expect(pendingReasonOf(READY)).toBeNull();
  });

  it("blocks the check for a legacy Sell provider, with its notice", () => {
    const notice = sellMode(LEGACY_PROVIDER).texts.sellProviderNotice;
    expect(notice).not.toBeNull();
    expect(pendingReasonOf({ ...READY, sellProviderNotice: notice })).toBe(notice);
    expect(pendingReasonOf({ ...READY, payload: "", sellProviderNotice: notice })).toBe(notice);
  });

  it("asks for the missing inputs in order", () => {
    expect(pendingReasonOf({ ...READY, payload: "", signature: "" })).toMatch(/payload/);
    expect(pendingReasonOf({ ...READY, signature: "" })).toMatch(/signature/);
    expect(pendingReasonOf({ ...READY, hasPartnerPublicKey: false })).toBe("Select a provider.");
    expect(pendingReasonOf({ ...READY, hasPartnerPublicKey: false, keySource: "custom" })).toMatch(
      /public key/,
    );
    expect(pendingReasonOf({ ...READY, hasExpectedErrors: true })).toMatch(/expected values/);
  });
});

describe("resultBanner", () => {
  const error = { severity: "error" as const };
  const warning = { severity: "warning" as const };

  it("counts the errors of an invalid report", () => {
    expect(resultBanner({ valid: false, issues: [error, warning] })).toMatchObject({
      appearance: "error",
      title: "Invalid",
      description: expect.stringMatching(/^1 error found/),
    });
    expect(resultBanner({ valid: false, issues: [error, error] }).description).toMatch(
      /^2 errors found/,
    );
  });

  it("does not claim that an expected value or key mismatch is a device rejection", () => {
    expect(resultBanner({ valid: false, issues: [error] }).description).toBe(
      "1 error found. The payload would be rejected by Ledger Live or the Exchange app, or does not match the values or key you provided.",
    );
  });

  it("warns about a valid report with warnings", () => {
    expect(resultBanner({ valid: true, issues: [warning, warning] })).toMatchObject({
      appearance: "warning",
      title: "Valid, with warnings",
      description: expect.stringMatching(/read the 2 warnings below/),
    });
    expect(resultBanner({ valid: true, issues: [warning] }).description).toMatch(
      /read the 1 warning below/,
    );
  });

  it("reports a clean valid report as valid", () => {
    expect(resultBanner({ valid: true, issues: [] })).toMatchObject({
      appearance: "success",
      title: "Valid",
    });
  });

  it("says which checks passed and which still happen on the device", () => {
    for (const issues of [[], [warning]]) {
      const { description } = resultBanner({ valid: true, issues });
      expect(description).toMatch(
        /^Passes the payload and signature checks performed by Ledger Live and the Exchange app/,
      );
      expect(description).toContain(
        "Fee size, address ownership and coin app checks still happen on the device.",
      );
    }
  });
});
