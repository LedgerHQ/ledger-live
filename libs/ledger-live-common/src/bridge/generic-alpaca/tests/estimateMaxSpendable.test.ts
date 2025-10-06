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
const dummyAccounts = [
  {
    id: "js:2:ripple:r123:",
    type: "Account",
    spendableBalance: new BigNumber(50000000),
    balance: new BigNumber(60000000),
    currency: { id: "ripple", family: "xrp", name: "XRP", units: [{ name: "XRP", magnitude: 6 }] },
    freshAddress: "r123",
    pendingOperations: [],
  },
  {
    id: "js:2:stellar:s123:",
    type: "Account",
    spendableBalance: new BigNumber(50000000),
    balance: new BigNumber(60000000),
    currency: {
      id: "stellar",
      family: "stellar",
      name: "Stellar",
      units: [{ name: "XLM", magnitude: 7 }],
    },
    freshAddress: "s123",
    pendingOperations: [],
  },
  {
    id: "js:2:tezos:t123",
    type: "Account",
    spendableBalance: new BigNumber(50000000),
    balance: new BigNumber(60000000),
    currency: {
      id: "tezos",
      family: "tezos",
      name: "Tezos",
      units: [{ name: "XTZ", magnitude: 6 }],
    },
    freshAddress: "t123",
    pendingOperations: [],
  },
] as unknown as Account[];

["xrp", "stellar", "tezos"].forEach((currencyName, idx) => {
  describe(`genericEstimateMaxSpendable for ${currencyName}`, () => {
    const dummyAccount = dummyAccounts[idx];

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("subtracts estimated fee from spendable balance", async () => {
      mockedGetAlpacaApi.mockReturnValue({
        estimateFees: jest.fn().mockResolvedValue({ value: 10000n }),
        validateIntent: jest.fn().mockResolvedValue({ amount: 49990000n }),
      });

      const estimate = genericEstimateMaxSpendable(currencyName, "local");
      const result = await estimate({
        account: dummyAccount,
        parentAccount: null,
        transaction: {},
      });

      expect(result.toString()).toBe("49990000");
    });

    it("returns 0 if fee is higher than spendable", async () => {
      const poorAccount = {
        ...dummyAccount,
        spendableBalance: new BigNumber(5000),
      };

      mockedGetAlpacaApi.mockReturnValue({
        estimateFees: jest.fn().mockResolvedValue({ value: 10000n }),
        validateIntent: jest.fn().mockResolvedValue({ amount: 0n }),
      });

      const estimate = genericEstimateMaxSpendable(currencyName, "local");
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
        validateIntent: jest.fn().mockResolvedValue({ amount: 50000000n }),
      });

      const estimate = genericEstimateMaxSpendable(currencyName, "local");
      const result = await estimate({
        account: dummyAccount,
        parentAccount: null,
        transaction: {},
      });

      expect(result.toString()).toBe("50000000");
    });
  });
});
