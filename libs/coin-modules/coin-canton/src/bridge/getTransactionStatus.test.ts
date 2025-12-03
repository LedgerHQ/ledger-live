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
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { createMockAccount } from "../test/fixtures";
import { CantonAccount, TooManyUtxosCritical, TooManyUtxosWarning, Transaction } from "../types";
import {
  getTransactionStatus,
  TO_MANY_UTXOS_CRITICAL_COUNT,
  TO_MANY_UTXOS_WARNING_COUNT,
} from "./getTransactionStatus";

jest.mock("../config", () => ({ getCoinConfig: jest.fn() }));
const mockCoinConfig = jest.mocked(coinConfig);

describe("getTransactionStatus", () => {
  const mockAccount: CantonAccount = {
    ...createMockAccount({
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(1000),
      freshAddress: "test::33333333333333333333333333333333333333333333333333333333333333333333",
    }),
    cantonResources: {
      instrumentUtxoCounts: {
        Amulet: 5,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoinConfig.getCoinConfig.mockReturnValue({
      minReserve: 100,
      networkType: "mainnet",
      status: { type: "active" },
      nativeInstrumentId: "Amulet",
    });
  });

  describe("fee validation", () => {
    it("should return FeeNotLoaded error when fee is null", async () => {
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

    it("should return FeeNotLoaded error when fee is undefined", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: undefined,
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.fee).toBeInstanceOf(FeeNotLoaded);
      expect(result.warnings).toEqual({});
    });

    it("should add FeeTooHigh warning when fee is more than 10 times the amount", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(1500),
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
        fee: new BigNumber(10),
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
        amount: mockAccount.balance
          .minus(new BigNumber(mockCoinConfig.getCoinConfig().minReserve))
          .plus(1),
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
        amount: new BigNumber(mockCoinConfig.getCoinConfig().minReserve).minus(1),
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
        amount: mockAccount.balance.multipliedBy(0.5),
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

    it("should not return error when sending to self", async () => {
      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: mockAccount.freshAddress,
        fee: new BigNumber(10),
        tokenId: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeUndefined();
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
      mockCoinConfig.getCoinConfig.mockReturnValue({
        minReserve: 0,
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

      const result = await getTransactionStatus(mockAccount, transaction);

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

  describe("UTXO count validation", () => {
    it("should show critical warning when UTXO count exceeds TO_MANY_UTXOS_CRITICAL_COUNT", async () => {
      const accountWithTooManyUtxos = {
        ...mockAccount,
        cantonResources: {
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_CRITICAL_COUNT + 1,
          },
        },
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "Amulet",
      };

      const result = await getTransactionStatus(accountWithTooManyUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeDefined();
      expect(result.warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosCritical);
    });

    it("should show warning when UTXO count exceeds TO_MANY_UTXOS_WARNING_COUNT", async () => {
      const accountWithManyUtxos = {
        ...mockAccount,
        cantonResources: {
          pendingTransferProposals: [],
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_WARNING_COUNT + 1,
          },
        },
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "Amulet",
      };

      const result = await getTransactionStatus(accountWithManyUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeDefined();
      expect(result.warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosWarning);
      expect(result.warnings.tooManyUtxos?.message).toContain(
        "families.canton.tooManyUtxos.warning",
      );
    });

    it("should not show warning or error when UTXO count is less than TO_MANY_UTXOS_WARNING_COUNT", async () => {
      const accountWithFewUtxos = {
        ...mockAccount,
        cantonResources: {
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_WARNING_COUNT - 1,
          },
        },
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "Amulet", // Use the same tokenId as in cantonResources
      };

      const result = await getTransactionStatus(accountWithFewUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeUndefined();
    });

    it("should not show warning or error for abandon seed address transactions", async () => {
      const accountWithManyUtxos = {
        ...mockAccount,
        cantonResources: {
          instrumentUtxoCounts: {
            Amulet: 25,
          },
        },
      };

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(50),
        recipient: "abandon::ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        fee: new BigNumber(10),
        tokenId: "Amulet",
      };

      const result = await getTransactionStatus(accountWithManyUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeUndefined();
      expect(result.errors.utxoCount).toBeUndefined();
    });
  });
});
