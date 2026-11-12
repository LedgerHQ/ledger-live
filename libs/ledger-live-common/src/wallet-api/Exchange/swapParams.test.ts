import BigNumber from "bignumber.js";
import { ExchangeError } from "./error";
import {
  parseSwapFeeParams,
  parseSwapFeeValue,
  parseSwapHistoryAmounts,
  parseSwapNumericParam,
  transformToBigNumbers,
} from "./swapParams";

describe("parseSwapFeeValue", () => {
  it.each([
    ["1000", new BigNumber(1000)],
    ["0x10", new BigNumber(16)],
    [new BigNumber(5), new BigNumber(5)],
    [7, new BigNumber(7)],
    ["", new BigNumber(0)],
    [null, new BigNumber(0)],
    [undefined, new BigNumber(0)],
  ])("reads %p", (value, expected) => {
    expect(parseSwapFeeValue("gasPrice", value)).toEqual(expected);
  });

  it.each(["abc", "1_000", " ", true])("rejects %p as wrong swap params", value => {
    expect(() => parseSwapFeeValue("gasPrice", value)).toThrow(ExchangeError);
  });
});

describe("transformToBigNumbers", () => {
  it("reads the numeric fee keys, recursively, keeping nullish values and other keys as is", () => {
    const utxoStrategy = { strategy: 0, excludeUTXOs: [] };
    expect(
      transformToBigNumbers({
        gasPrice: "1000",
        nested: { maxFeePerGas: "0x10", label: "fast" },
        fees: "",
        feePerByte: null,
        utxoStrategy,
        rbf: true,
        label: "custom",
        note: "abc",
      }),
    ).toEqual({
      gasPrice: new BigNumber(1000),
      nested: { maxFeePerGas: new BigNumber(16), label: "fast" },
      fees: undefined,
      feePerByte: null,
      utxoStrategy,
      rbf: true,
      label: "custom",
      note: "abc",
    });
  });

  it("keeps an EIP-1559 config's null gasPrice and reads its maxFeePerGas", () => {
    expect(
      transformToBigNumbers({
        gasPrice: null,
        maxFeePerGas: "30000000000",
        maxPriorityFeePerGas: "0x10",
      }),
    ).toEqual({
      gasPrice: null,
      maxFeePerGas: new BigNumber("30000000000"),
      maxPriorityFeePerGas: new BigNumber(16),
    });
  });

  it.each(["abc", "1_000", " "])("rejects the fee value %p, nested or not", value => {
    expect(() => transformToBigNumbers({ gasPrice: value })).toThrow(
      expect.objectContaining({ cause: "WRONG_SWAP_PARAMS" }),
    );
    expect(() => transformToBigNumbers({ nested: { feePerByte: value } })).toThrow(
      expect.objectContaining({ cause: "WRONG_SWAP_PARAMS" }),
    );
  });

  it.each([{ fees: { fee: {} } }, { fees: { fee: ["abc"] } }, { gasPrice: { value: "1" } }])(
    "rejects an object where a number is expected: %j",
    config => {
      expect(() => transformToBigNumbers(config)).toThrow(
        expect.objectContaining({ cause: "WRONG_SWAP_PARAMS" }),
      );
    },
  );

  it("reads a structured fee object such as Mina's", () => {
    expect(transformToBigNumbers({ fees: { fee: "1000", accountCreationFee: "0" } })).toEqual({
      fees: { fee: new BigNumber(1000), accountCreationFee: new BigNumber(0) },
    });
    expect(transformToBigNumbers({ fees: { fee: "", accountCreationFee: null } })).toEqual({
      fees: { fee: new BigNumber(0), accountCreationFee: new BigNumber(0) },
    });
  });
});

describe("parseSwapFeeParams", () => {
  it("parses the amount and the optional gas limit", () => {
    expect(parseSwapFeeParams({ fromAmount: "1.5", gasLimit: "21000" })).toEqual({
      fromAmount: new BigNumber("1.5"),
      gasLimit: new BigNumber(21000),
    });
    expect(parseSwapFeeParams({ fromAmount: "1.5" })).toEqual({
      fromAmount: new BigNumber("1.5"),
      gasLimit: null,
    });
    expect(parseSwapFeeParams({ fromAmount: "1.5", gasLimit: "" }).gasLimit).toBeNull();
  });

  it.each(["", undefined, null])(
    "estimates fees for 0 when no amount %p is typed yet",
    fromAmount => {
      expect(parseSwapFeeParams({ fromAmount }).fromAmount).toEqual(new BigNumber(0));
    },
  );

  it.each(["abc", "1_000", "0x10", "-1"])("rejects the amount %p", fromAmount => {
    expect(() => parseSwapFeeParams({ fromAmount })).toThrow(ExchangeError);
    expect(() => parseSwapFeeParams({ fromAmount })).toThrow("swap params are not correctly set");
  });

  it("accepts a hex gas limit", () => {
    expect(parseSwapFeeParams({ fromAmount: "1", gasLimit: "0x10" }).gasLimit).toEqual(
      new BigNumber(16),
    );
  });

  it.each(["abc", "1_000", "-5", "21000.5"])("rejects the gas limit %p", gasLimit => {
    expect(() => parseSwapFeeParams({ fromAmount: "1", gasLimit })).toThrow(ExchangeError);
  });
});

describe("parseSwapNumericParam", () => {
  it("reads a decimal and rejects anything else", () => {
    expect(parseSwapNumericParam("fromAmountAtomic", "1000")).toEqual(new BigNumber(1000));
    expect(() => parseSwapNumericParam("fromAmountAtomic", "0x10")).toThrow(
      expect.objectContaining({ cause: "WRONG_SWAP_PARAMS" }),
    );
  });
});

describe("parseSwapHistoryAmounts", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  it("parses the amounts and keeps an absent final amount absent", () => {
    expect(parseSwapHistoryAmounts({ fromAmount: "1", toAmount: "2", finalAmount: "2.5" })).toEqual(
      {
        fromAmount: new BigNumber(1),
        toAmount: new BigNumber(2),
        finalAmount: new BigNumber("2.5"),
      },
    );
    expect(parseSwapHistoryAmounts({ fromAmount: "1", toAmount: "2" }).finalAmount).toBeUndefined();
    expect(
      parseSwapHistoryAmounts({ fromAmount: "1", toAmount: "2", finalAmount: "" }).finalAmount,
    ).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(["abc", "1_000", "0x10", " "])("falls back to 0 without throwing for %p", value => {
    expect(
      parseSwapHistoryAmounts({ fromAmount: value, toAmount: value, finalAmount: value }),
    ).toEqual({ fromAmount: new BigNumber(0), toAmount: new BigNumber(0), finalAmount: undefined });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
