import * as EIP712 from "@ledgerhq/evm-tools/message/EIP712/index";
import BigNumber from "bignumber.js";
import { DEFAULT_GAS_LIMIT } from "@ledgerhq/coin-evm/logic-public";
import { getEstimatedFees, getGasLimit, getMessageProperties, parseGasLimitInput } from "./utils";

jest.mock("@ledgerhq/evm-tools/message/EIP712/index");
jest.mock("@shared/env", () => ({
  getEnv: jest.fn().mockReturnValue("https://cal.ledger.com"),
}));

const mockGetEIP712Fields = jest.mocked(EIP712.getEIP712FieldsDisplayedOnNano);

describe("parseGasLimitInput", () => {
  it.each([
    ["21000", new BigNumber(21000)],
    ["0x5208", new BigNumber(21000)],
    ["", new BigNumber(0)],
  ])("reads %p", (input, expected) => {
    expect(parseGasLimitInput(input)).toEqual(expected);
  });

  it.each(["abc", "1_000", "-5", "21000.5", "Infinity"])(
    "falls back to the default gas limit for %p",
    input => {
      expect(parseGasLimitInput(input)).toEqual(DEFAULT_GAS_LIMIT);
    },
  );
});

describe("getGasLimit", () => {
  it("returns gasLimit when customGasLimit is not provided", () => {
    const tx = { gasLimit: new BigNumber(100), customGasLimit: undefined } as any;
    expect(getGasLimit(tx)).toEqual(new BigNumber(100));
  });

  it("returns customGasLimit when provided", () => {
    const tx = { gasLimit: new BigNumber(100), customGasLimit: new BigNumber(200) } as any;
    expect(getGasLimit(tx)).toEqual(new BigNumber(200));
  });
});

describe("getEstimatedFees", () => {
  describe("without customGasLimit", () => {
    it("returns right fee estimation for a legacy tx", () => {
      const tx = { type: 0, gasLimit: new BigNumber(3), gasPrice: new BigNumber(23) } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(69));
    });

    it("returns right fee estimation for a 1559 tx", () => {
      const tx = { type: 2, gasLimit: new BigNumber(42), maxFeePerGas: new BigNumber(10) } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(420));
    });
  });

  describe("with customGasLimit", () => {
    it("returns right fee estimation for a legacy tx", () => {
      const tx = {
        type: 0,
        gasLimit: new BigNumber(4),
        customGasLimit: new BigNumber(3),
        gasPrice: new BigNumber(23),
      } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(69));
    });

    it("returns right fee estimation for a 1559 tx", () => {
      const tx = {
        type: 2,
        gasLimit: new BigNumber(43),
        customGasLimit: new BigNumber(42),
        maxFeePerGas: new BigNumber(10),
      } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(420));
    });
  });

  it("falls back to zero for a tx without type", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10) } as any)).toEqual(new BigNumber(0));
  });

  it("falls back to zero for a badly formatted legacy tx", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10), type: 0 } as any)).toEqual(
      new BigNumber(0),
    );
  });

  it("falls back to zero for a badly formatted 1559 tx", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10), type: 2 } as any)).toEqual(
      new BigNumber(0),
    );
  });
});

describe("getMessageProperties", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null for a non-EIP712 message", async () => {
    expect(await getMessageProperties({ standard: "EIP191", message: "doot-doot" })).toBe(null);
  });

  it("returns fields displayed on the Nano for an EIP712 message", async () => {
    mockGetEIP712Fields.mockResolvedValueOnce([{ label: "key", value: "value" }]);

    expect(
      await getMessageProperties({
        standard: "EIP712",
        message: {} as any,
        domainHash: "0xabc",
        hashStruct: "0xdef",
      }),
    ).toEqual([{ label: "key", value: "value" }]);
  });
});
