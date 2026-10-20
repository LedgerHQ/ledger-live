import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getBitcoinCoinConfig } from "../coinConfig";
import { isStrategyDisabled } from "./isStrategyDisabled";

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

describe("isStrategyDisabled", () => {
  it("should return true if the strategy's fee rate is lower than the minimum fee rate", () => {
    const transaction = {
      rbf: true,
      feePerByte: new BigNumber(100),
    } as any;
    const feesStrategy = new BigNumber(90);
    expect(isStrategyDisabled({ mainAccount, transaction, feesStrategy })).toBe(true);
  });

  it("should return false if the strategy's fee rate is higher than the minimum fee rate", () => {
    const transaction = {
      rbf: true,
      feePerByte: new BigNumber(1200000000),
    } as any;
    const feesStrategy = new BigNumber(1320000000);
    expect(isStrategyDisabled({ mainAccount, transaction, feesStrategy })).toBe(false);
  });

  it("should return true if RBF is explicitly disabled", () => {
    const transaction = {
      rbf: false,
      feePerByte: new BigNumber("100000000"),
    } as any;
    const feesStrategy = new BigNumber(150000000);
    expect(isStrategyDisabled({ mainAccount, transaction, feesStrategy })).toBe(true);
  });

  it.each([new BigNumber(-1), new BigNumber(0)])(
    "should return true if the strategy's fee rate is less than or equal to 0",
    feesStrategy => {
      const transaction = {
        rbf: true,
        feePerByte: new BigNumber("100"),
      } as any;

      expect(isStrategyDisabled({ mainAccount, transaction, feesStrategy })).toBe(true);
    },
  );
});
