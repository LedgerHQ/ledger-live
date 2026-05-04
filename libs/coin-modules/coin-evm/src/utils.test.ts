import { buildSmartContractDetails, isSmartContractInput, safeEncodeEIP55 } from "./utils";

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
