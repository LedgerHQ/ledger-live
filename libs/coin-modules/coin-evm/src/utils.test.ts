import { EtherscanAPIError } from "./errors";
import {
  buildSmartContractDetails,
  getErrorCode,
  getErrorMessage,
  isExpectedSeiNoDelegationError,
  isSmartContractInput,
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

describe("getErrorCode", () => {
  it("should return error code", () => {
    const expectedCode = 400;
    const result = getErrorCode({
      code: expectedCode,
    });

    expect(result).toEqual(String(expectedCode));
  });

  it.each([1, "", "filled string", {}, null, undefined, [], ["filled array"]])(
    "should return undefined for %s",
    (error: unknown) => {
      expect(getErrorCode(error)).toBeUndefined();
    },
  );
});

describe("getErrorMessage", () => {
  it("should return error message", () => {
    const expectedMessage = "Type 'Account' is not assignable to type 'TokenAccount'.";
    expect(getErrorMessage(new Error(expectedMessage))).toEqual(expectedMessage);
  });

  it.each([1, "", "filled string", {}, null, undefined, [], ["filled array"]])(
    "should error stringified (%s)",
    (error: unknown) => {
      expect(getErrorMessage(error)).toEqual(String(error));
    },
  );
});

describe("isExpectedSeiNoDelegationError", () => {
  it.each(["evm", "base", "arbitrum", "solana", "bitcoin"])(
    "should return false when currency id is not sei (%s)",
    (currencyId: string) => {
      expect(isExpectedSeiNoDelegationError(currencyId, undefined)).toEqual(false);
    },
  );

  it.each(["missing revert data", "execution reverted"])(
    "should return true when it is sei no delegation error (message: %s)",
    (message: string) => {
      const error: Error = new SeiNoDelegationError(message);

      expect(isExpectedSeiNoDelegationError("sei_evm", error)).toEqual(true);
    },
  );
  it.each([
    new Error("Type 'Account' is not assignable to type 'TokenAccount'."),
    new EtherscanAPIError(),
  ])("should return false when it not is sei no delegation error", (error: unknown) => {
    expect(isExpectedSeiNoDelegationError("sei_evm", error)).toEqual(false);
  });
});

class SeiNoDelegationError extends Error {
  name: string = "SeiNoDelegationError";
  private _code: string = "CALL_EXCEPTION";

  constructor(message: string) {
    super(message);
  }

  get code() {
    return this._code;
  }
}
