import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getBitcoinCoinConfig } from "../coinConfig";
import { getMinFees } from "./getMinEditTransactionFees";

jest.mock("../coinConfig", () => ({
  getBitcoinCoinConfig: jest.fn(),
}));

const mockedGetBitcoinCoinConfig = jest.mocked(getBitcoinCoinConfig);
const coinConfigWithFees = (fees: BitcoinCoinConfig["fees"] = {}): BitcoinCoinConfig => ({
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorer: { url: "https://explorer.test.invalid" },
  fees,
});

const mainAccount = { currency: { id: "bitcoin" } } as Account;

beforeEach(() => {
  mockedGetBitcoinCoinConfig.mockReturnValue(coinConfigWithFees());
});

describe("getMinFees", () => {
  it("returns at least +1 sat/vB bump for very small fees", () => {
    const feePerByte = new BigNumber(1);
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(2))).toBe(true);
  });

  it("returns at least +10% bump for larger fees", () => {
    const feePerByte = new BigNumber(100);
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(110))).toBe(true);
  });

  it("returns the same result when +10% and +1 sat/vB are equal", () => {
    const feePerByte = new BigNumber(10);
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(11))).toBe(true);
  });

  it("rounds up to the next integer when the bump is fractional", () => {
    const feePerByte = new BigNumber(15);
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(17))).toBe(true);
    expect(bumped.isInteger()).toBe(true);
  });

  it("handles zero fee by returning 1 sat/vB", () => {
    const feePerByte = new BigNumber(0);
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(1))).toBe(true);
  });

  it("works with non-integer input fees", () => {
    const feePerByte = new BigNumber("1.5");
    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte });

    expect(bumped.isEqualTo(new BigNumber(3))).toBe(true);
  });

  it("bumps by the RBF ratio of the account's coin config", () => {
    mockedGetBitcoinCoinConfig.mockReturnValue(coinConfigWithFees({ rbfMinBumpRatio: 0.25 }));

    const { feePerByte: bumped } = getMinFees({ mainAccount, feePerByte: new BigNumber(100) });

    expect(bumped.isEqualTo(new BigNumber(125))).toBe(true);
    expect(mockedGetBitcoinCoinConfig).toHaveBeenCalledWith("bitcoin");
  });
});
