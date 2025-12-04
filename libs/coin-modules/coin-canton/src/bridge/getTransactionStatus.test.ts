import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import * as gateway from "../network/gateway";
import {
  createMockCantonAccount,
  createMockCoinConfigValue,
  createMockTransaction,
} from "../test/fixtures";
import { CantonAccount, TooManyUtxosCritical, TooManyUtxosWarning } from "../types";
import { TopologyChangeError } from "../types/errors";
import {
  getTransactionStatus,
  TO_MANY_UTXOS_CRITICAL_COUNT,
  TO_MANY_UTXOS_WARNING_COUNT,
} from "./getTransactionStatus";

jest.mock("../config", () => ({ getCoinConfig: jest.fn() }));
jest.mock("../network/gateway");
const mockCoinConfig = jest.mocked(coinConfig);
const mockedGateway = gateway as jest.Mocked<typeof gateway>;

describe("getTransactionStatus", () => {
  const mockAccount = createMockCantonAccount(
    {
      balance: new BigNumber(1000),
      spendableBalance: new BigNumber(1000),
      freshAddress: "bob::a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
    },
    {
      instrumentUtxoCounts: {
        Amulet: 5,
      },
    },
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoinConfig.getCoinConfig.mockReturnValue(createMockCoinConfigValue());
  });

  describe("fee validation", () => {
    it("should return FeeNotLoaded error when fee is null", async () => {
      const transaction = createMockTransaction({ fee: null });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.fee).toBeInstanceOf(FeeNotLoaded);
      expect(result.warnings).toEqual({});
    });

    it("should return FeeNotLoaded error when fee is undefined", async () => {
      const transaction = createMockTransaction({ fee: undefined });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.fee).toBeInstanceOf(FeeNotLoaded);
      expect(result.warnings).toEqual({});
    });

    it("should add FeeTooHigh warning when fee is more than 10 times the amount", async () => {
      const transaction = createMockTransaction({ fee: new BigNumber(1500) });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
      // Don't check for empty errors since there might be balance issues
    });

    it("should not add FeeTooHigh warning when fee is reasonable", async () => {
      const transaction = createMockTransaction();

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.warnings).toEqual({});
      expect(result.errors).toEqual({});
    });
  });

  describe("balance validation", () => {
    it("should return NotEnoughSpendableBalance error when total spent exceeds balance minus reserve", async () => {
      const transaction = createMockTransaction({
        amount: mockAccount.balance
          .minus(new BigNumber(mockCoinConfig.getCoinConfig().minReserve))
          .plus(1),
      });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughSpendableBalance);
    });

    it("should return NotEnoughBalanceBecauseDestinationNotCreated error when amount is below reserve", async () => {
      const transaction = createMockTransaction({
        amount: new BigNumber(mockCoinConfig.getCoinConfig().minReserve).minus(1),
      });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });

    it("should pass balance validation when transaction is within limits", async () => {
      const transaction = createMockTransaction({
        amount: mockAccount.balance.multipliedBy(0.5),
      });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is missing", async () => {
      const transaction = createMockTransaction({ recipient: "" });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should not return error when sending to self", async () => {
      const transaction = createMockTransaction({ recipient: mockAccount.freshAddress });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeUndefined();
    });

    it("should return InvalidAddress error when recipient is invalid", async () => {
      const transaction = createMockTransaction({ recipient: "invalid-address" });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should pass recipient validation when recipient is valid", async () => {
      const transaction = createMockTransaction({});

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero", async () => {
      mockCoinConfig.getCoinConfig.mockReturnValue(createMockCoinConfigValue({ minReserve: 0 }));

      const transaction = createMockTransaction({
        amount: new BigNumber(0),
        recipient: "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876a",
      });

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired error when amount is positive", async () => {
      const transaction = createMockTransaction();

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("return values", () => {
    it("should return correct estimatedFees, amount, and totalSpent", async () => {
      const transaction = createMockTransaction();

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.estimatedFees).toEqual(new BigNumber(10));
      expect(result.amount).toEqual(new BigNumber(100));
      expect(result.totalSpent).toEqual(new BigNumber(110));
    });

    it("should return empty errors and warnings when transaction is valid", async () => {
      const transaction = createMockTransaction();

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
          ...mockAccount.cantonResources,
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_CRITICAL_COUNT + 1,
          },
        },
      };
      const transaction = createMockTransaction({ tokenId: "Amulet" });

      const result = await getTransactionStatus(accountWithTooManyUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeDefined();
      expect(result.warnings.tooManyUtxos).toBeInstanceOf(TooManyUtxosCritical);
    });

    it("should show warning when UTXO count exceeds TO_MANY_UTXOS_WARNING_COUNT", async () => {
      const accountWithManyUtxos = {
        ...mockAccount,
        cantonResources: {
          ...mockAccount.cantonResources,
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_WARNING_COUNT + 1,
          },
        },
      };

      const transaction = createMockTransaction({ tokenId: "Amulet" });

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
          ...mockAccount.cantonResources,
          instrumentUtxoCounts: {
            Amulet: TO_MANY_UTXOS_WARNING_COUNT - 1,
          },
        },
      };

      const transaction = createMockTransaction({ tokenId: "Amulet" });

      const result = await getTransactionStatus(accountWithFewUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeUndefined();
    });

    it("should not show warning or error for abandon seed address transactions", async () => {
      const accountWithManyUtxos = {
        ...mockAccount,
        cantonResources: {
          ...mockAccount.cantonResources,
          instrumentUtxoCounts: {
            Amulet: 25,
          },
        },
      };

      const transaction = createMockTransaction({
        recipient: "abandon::ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        tokenId: "Amulet",
      });

      const result = await getTransactionStatus(accountWithManyUtxos, transaction);

      expect(result.warnings.tooManyUtxos).toBeUndefined();
      expect(result.errors.utxoCount).toBeUndefined();
    });
  });

  describe("topology validation", () => {
    it("should return TopologyChangeError when isTopologyChangeRequiredCached returns true", async () => {
      // GIVEN
      const accountWithPartyId: CantonAccount = {
        ...mockAccount,
        xpub: "test-party-id",
        cantonResources: {
          ...mockAccount.cantonResources,
          publicKey: "test-public-key",
        },
      };
      mockedGateway.isTopologyChangeRequiredCached.mockResolvedValue(true);

      const transaction = createMockTransaction({
        recipient: "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876a",
      });

      // WHEN
      const result = await getTransactionStatus(accountWithPartyId, transaction);

      // THEN
      expect(result.errors.topologyChange).toBeInstanceOf(TopologyChangeError);
      expect(mockedGateway.isTopologyChangeRequiredCached).toHaveBeenCalledWith(
        accountWithPartyId.currency,
        "test-public-key",
      );
    });

    it("should not return topology error when isTopologyChangeRequiredCached returns false", async () => {
      // GIVEN
      const accountWithPartyId: CantonAccount = {
        ...mockAccount,
        xpub: "test-party-id",
        cantonResources: {
          ...mockAccount.cantonResources,
          publicKey: "test-public-key",
        },
      };
      mockedGateway.isTopologyChangeRequiredCached.mockResolvedValue(false);

      const transaction = createMockTransaction({
        recipient: "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876a",
      });

      // WHEN
      const result = await getTransactionStatus(accountWithPartyId, transaction);

      // THEN
      expect(result.errors.topologyChange).toBeUndefined();
      expect(mockedGateway.isTopologyChangeRequiredCached).toHaveBeenCalledWith(
        accountWithPartyId.currency,
        "test-public-key",
      );
    });

    it("should not return topology error when isTopologyChangeRequiredCached throws an error", async () => {
      // GIVEN
      const accountWithPartyId: CantonAccount = {
        ...mockAccount,
        xpub: "test-party-id",
        cantonResources: {
          ...mockAccount.cantonResources,
          publicKey: "test-public-key",
        },
      };
      mockedGateway.isTopologyChangeRequiredCached.mockRejectedValue(new Error("Network error"));

      const transaction: Transaction = {
        family: "canton",
        amount: new BigNumber(100),
        recipient: "valid::11111111111111111111111111111111111111111111111111111111111111111111",
        fee: new BigNumber(10),
        tokenId: "",
      };

      // WHEN
      const result = await getTransactionStatus(accountWithPartyId, transaction);

      // THEN
      expect(result.errors.topologyChange).toBeUndefined();
      expect(mockedGateway.isTopologyChangeRequiredCached).toHaveBeenCalledWith(
        accountWithPartyId.currency,
        "test-public-key",
      );
    });
  });
});
