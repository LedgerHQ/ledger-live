import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getTransactionStatus } from "./getTransactionStatus";
import { Transaction } from "../types";
import coinConfig from "../config";

// Mock the coin config
jest.mock("../config", () => ({
  getCoinConfig: jest.fn(),
}));

const mockCoinConfig = jest.mocked(coinConfig);

describe("getTransactionStatus", () => {
  const mockCurrency: CryptoCurrency = {
    id: "canton_network",
    name: "Canton Network",
    family: "canton",
    units: [
      {
        name: "Canton",
        code: "CANTON",
        magnitude: 8,
      },
    ],
    ticker: "CANTON",
    scheme: "canton",
    color: "#000000",
    type: "CryptoCurrency",
    managerAppName: "Canton",
    coinType: 0,
    disableCountervalue: false,
    delisted: false,
    keywords: ["canton"],
    explorerViews: [],
    terminated: {
      link: "",
    },
  };

  const mockAccount: Account = {
    id: "test-account-id",
    seedIdentifier: "test-seed-identifier",
    currency: mockCurrency,
    balance: new BigNumber(1000), // 1000 units
    spendableBalance: new BigNumber(1000),
    freshAddress: "test::33333333333333333333333333333333333333333333333333333333333333333333",
    freshAddressPath: "44'/60'/0'/0/0",
    index: 0,
    derivationMode: "canton",
    used: true,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    creationDate: new Date(),
    operationsCount: 0,
    blockHeight: 100,
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    nfts: [],
    subAccounts: [],
    type: "Account",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoinConfig.getCoinConfig.mockReturnValue({
      minReserve: 100, // 100 units minimum reserve
      networkType: "mainnet",
      status: { type: "active" },
      nativeInstrumentId: "Amulet",
    });
  });

  describe("fee validation", () => {
    it("should return FeeNotLoaded error when fee is not provided", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: null,
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.fee).toBeInstanceOf(FeeNotLoaded);
      expect(result.warnings).toEqual({});
    });

    it("should return FeeRequired error when fee is zero", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(0),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.fee).toBeInstanceOf(FeeRequired);
      expect(result.warnings).toEqual({});
    });

    it("should add FeeTooHigh warning when fee is more than 10 times the amount", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100), // Use larger amount to avoid balance issues
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(1500), // 15x the amount
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
      // Don't check for empty errors since there might be balance issues
    });

    it("should not add FeeTooHigh warning when fee is reasonable", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10), // 0.1x the amount
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.warnings).toEqual({});
      expect(result.errors).toEqual({});
    });
  });

  describe("balance validation", () => {
    it("should return NotEnoughSpendableBalance error when total spent exceeds balance minus reserve", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(950), // 950 + 10 fee = 960, but balance is 1000 and reserve is 100
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
    });

    it("should return NotEnoughBalanceBecauseDestinationNotCreated error when amount is below reserve", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50), // Below reserve amount of 100
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });

    it("should pass balance validation when transaction is within limits", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(800), // 800 + 10 fee = 810, balance is 1000, reserve is 100, so 900 available
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is missing", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource error when sending to self", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "test::33333333333333333333333333333333333333333333333333333333333333333333", // Same as account.freshAddress
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("should return InvalidAddress error when recipient is invalid", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "invalid-address",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should pass recipient validation when recipient is valid", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::22222222222222222222222222222222222222222222222222222222222222222222",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero", async () => {
      // Create a scenario where there are no other amount errors
      // Use a high balance and amount above reserve to avoid other amount errors
      const accountWithHighBalance = {
        ...mockAccount,
        balance: new BigNumber(10000), // High balance to avoid balance errors
      };

      // Set a high reserve to avoid the NotEnoughBalanceBecauseDestinationNotCreated error
      mockCoinConfig.getCoinConfig.mockReturnValue({
        minReserve: 0, // Set reserve to 0 to avoid reserve-related errors
        networkType: "mainnet",
        status: { type: "active" },
        nativeInstrumentId: "Amulet",
      });

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(0),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(accountWithHighBalance, transaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired error when amount is positive", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("return values", () => {
    it("should return correct estimatedFees, amount, and totalSpent", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.estimatedFees).toEqual(new BigNumber(10));
      expect(result.amount).toEqual(new BigNumber(100));
      expect(result.totalSpent).toEqual(new BigNumber(110));
    });

    it("should return empty errors and warnings when transaction is valid", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
    });
  });

  describe("edge cases", () => {
    it("should handle account with zero balance", async () => {
      const accountWithZeroBalance = {
        ...mockAccount,
        balance: new BigNumber(0),
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(accountWithZeroBalance, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
    });

    it("should handle account with balance exactly equal to reserve", async () => {
      const accountWithReserveBalance = {
        ...mockAccount,
        balance: new BigNumber(100), // Exactly equal to reserve
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(accountWithReserveBalance, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
    });

    it("should handle zero reserve amount", async () => {
      mockCoinConfig.getCoinConfig.mockReturnValue({
        minReserve: 0,
        networkType: "mainnet",
        status: { type: "active" },
        nativeInstrumentId: "Amulet",
      });

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });

    it("should handle undefined reserve amount", async () => {
      mockCoinConfig.getCoinConfig.mockReturnValue({
        networkType: "mainnet",
        status: { type: "active" },
        nativeInstrumentId: "Amulet",
      });

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("multiple validation errors", () => {
    it("should return multiple errors when multiple validations fail", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(0), // AmountRequired
        recipient: "", // RecipientRequired
        fee: null, // FeeNotLoaded
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
      expect(result.errors.fee).toBeInstanceOf(FeeNotLoaded);
    });

    it("should return both errors and warnings", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(5), // Small amount
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(100), // High fee relative to amount
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });
  });
});
