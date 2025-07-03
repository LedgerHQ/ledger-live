import BigNumber from "bignumber.js";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import * as alpaca from "../alpaca";
import { Account } from "@ledgerhq/types-live";

// Mock the alpaca API
jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

const mockedGetAlpacaApi = alpaca.getAlpacaApi as jest.Mock;

// Dummy data
const dummyAccount = {
  id: "js:2:ripple:r123:",
  type: "Account", // <-- this is mandatory for getMainAccount to work
  spendableBalance: new BigNumber(50000000),
  currency: { id: "ripple", name: "XRP", units: [{ name: "XRP", magnitude: 6 }] },
  freshAddress: "r123",
} as unknown as Account;

describe("genericEstimateMaxSpendable", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("subtracts estimated fee from spendable balance", async () => {
    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 10000n }), // 0.01 XRP
    });

    const estimate = genericEstimateMaxSpendable("xrp", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("49990000"); // 50_000_000 - 10_000
  });

  it("returns 0 if fee is higher than spendable", async () => {
    const poorAccount = {
      ...dummyAccount,
      spendableBalance: new BigNumber(5000), // very low
    };

    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 10000n }),
    });

    const estimate = genericEstimateMaxSpendable("xrp", "local");
    const result = await estimate({
      account: poorAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("0");
  });

  it("returns full spendable balance if fee is 0", async () => {
    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 0n }),
    });

    const estimate = genericEstimateMaxSpendable("xrp", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("50000000");
  });
});
