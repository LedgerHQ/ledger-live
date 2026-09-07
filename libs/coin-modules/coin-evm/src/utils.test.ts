import {
  buildSmartContractDetails,
  isSmartContractInput,
  nftDisabled,
  nftEnabled,
  parseDecimalIntegerPart,
  safeEncodeEIP55,
} from "./utils";

describe("isSmartContractInput", () => {
  it.each([
    [undefined, false],
    [null, false],
    ["", false],
    ["   ", false],
    ["0x", false],
    ["0X", false],
    [" 0x ", false],
    ["0x00", true],
    ["0Xabcdef", true],
    ["0x1234567890abcdef", true],
    [" 0x01 ", true],
  ] as const)("isSmartContractInput(%p) === %s", (input, expected) => {
    expect(isSmartContractInput(input)).toBe(expected);
  });
});

describe("buildSmartContractDetails", () => {
  const calldata = "0x1234567890abcdef";

  it.each([
    ["0x", calldata],
    ["0x0", calldata],
  ] as const)(
    "classifies sentinel to %s with calldata as deployment and omits contractAddress without deployed address",
    (to, input) => {
      expect(buildSmartContractDetails(to, input)).toEqual({
        contractInteraction: "SmartContractDeployment",
        contractPayload: calldata,
      });
    },
  );

  it("sets contractAddress from deployed address when to is sentinel", () => {
    const deployed = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    expect(buildSmartContractDetails("0x", calldata, deployed)).toEqual({
      contractInteraction: "SmartContractDeployment",
      contractAddress: safeEncodeEIP55(deployed),
      contractPayload: calldata,
    });
  });

  it("normalizes uppercase 0X hex prefix to a single 0x-prefixed payload", () => {
    expect(buildSmartContractDetails(undefined, "0Xabcdef")).toEqual({
      contractInteraction: "SmartContractDeployment",
      contractPayload: "0xabcdef",
    });
  });

  it("builds contractPayload from trim-aware input (matches isSmartContractInput)", () => {
    expect(buildSmartContractDetails(undefined, "  0xabcdef  ")).toEqual({
      contractInteraction: "SmartContractDeployment",
      contractPayload: "0xabcdef",
    });
  });
});

describe("parseDecimalIntegerPart", () => {
  it.each([
    ["100", 100n],
    ["569.024692675122000000", 569n],
    ["0.019211023787000000", 0n],
    ["  42  ", 42n],
    ["1.", 1n],
    ["1000000000000000000", 1000000000000000000n],
    ["-5.9", -5n],
  ] as const)("parseDecimalIntegerPart(%p) === %s", (input, expected) => {
    expect(parseDecimalIntegerPart(input)).toBe(expected);
  });

  it.each(["", ".", "not-a-number", "abc.123"])(
    "returns 0n when the integer part is not parseable (%p)",
    input => {
      expect(parseDecimalIntegerPart(input)).toBe(0n);
    },
  );
});

describe("nftEnabled", () => {
  beforeEach(() => {
    process.env.NFT_CURRENCIES = JSON.stringify([]);
  });

  it("should return false when currency is null or undefined", () => {
    expect(nftEnabled(null)).toEqual(false);
    expect(nftEnabled(undefined)).toEqual(false);
  });

  it("should return false when NFT_CURRENCIES env does not include currency", () => {
    process.env.NFT_CURRENCIES = JSON.stringify(["base", "polygon"]);
    expect(nftEnabled("ethereum")).toEqual(false);
  });

  it("should return true when NFT_CURRENCIES env include currency", () => {
    process.env.NFT_CURRENCIES = JSON.stringify(["base", "ethereum", "polygon"]);
    expect(nftEnabled("ethereum")).toEqual(true);
  });

  it.each([
    "",
    "word",
    "a simple sentence",
    "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
    "[]}",
    "{ [] }",
  ])("should return false when NFT_CURRENCIES is not a valid JSON (%s)", value => {
    process.env.NFT_CURRENCIES = value;
    expect(nftEnabled("ethereum")).toEqual(false);
  });

  it("should return false when NFT_CURRENCIES is not an array", () => {
    // A new config not supported for example (feature flag like)
    process.env.NFT_CURRENCIES = JSON.stringify({
      enabled: true,
      params: { families: ["ethereum"] },
    });
    expect(nftEnabled("ethereum")).toBe(false);
  });
});

describe("nftDisabled", () => {
  beforeEach(() => {
    process.env.NFT_CURRENCIES = JSON.stringify([]);
  });

  it("should return false when currency is null or undefined", () => {
    expect(nftDisabled(null)).toEqual(true);
    expect(nftDisabled(undefined)).toEqual(true);
  });

  it("should return true when NFT_CURRENCIES env does not include currency", () => {
    process.env.NFT_CURRENCIES = JSON.stringify(["base", "polygon"]);
    expect(nftDisabled("ethereum")).toEqual(true);
  });

  it("should return false when NFT_CURRENCIES env include currency", () => {
    process.env.NFT_CURRENCIES = JSON.stringify(["base", "ethereum", "polygon"]);
    expect(nftDisabled("ethereum")).toEqual(false);
  });

  it.each([
    "",
    "word",
    "a simple sentence",
    "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
    "[]}",
    "{ [] }",
  ])("should return true when NFT_CURRENCIES is not a valid JSON (%s)", value => {
    process.env.NFT_CURRENCIES = value;
    expect(nftDisabled("ethereum")).toEqual(true);
  });

  it("should return true when NFT_CURRENCIES is not an array", () => {
    // A new config not supported for example (feature flag like)
    process.env.NFT_CURRENCIES = JSON.stringify({
      enabled: true,
      params: { families: ["ethereum"] },
    });
    expect(nftDisabled("ethereum")).toBe(true);
  });
});
