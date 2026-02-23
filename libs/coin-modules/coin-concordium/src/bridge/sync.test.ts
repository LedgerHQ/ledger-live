import BigNumber from "bignumber.js";
import {
  createFixtureCurrency,
  createFixtureOperation,
  VALID_ADDRESS,
  PUBLIC_KEY,
} from "../test/fixtures";
import { createTestConcordiumAccount } from "../test/testHelpers";
import { getAccountShape } from "./sync";

jest.mock("../network/proxyClient", () => ({
  getAccountsByPublicKey: jest.fn(),
  getAccountBalance: jest.fn(),
  getOperations: jest.fn(),
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn().mockReturnValue({ minReserve: "100000" }),
  },
}));

const { getAccountsByPublicKey, getAccountBalance, getOperations } =
  jest.requireMock("../network/proxyClient");

describe("sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mocks
    getAccountsByPublicKey.mockResolvedValue([{ address: VALID_ADDRESS }]);
    getAccountBalance.mockResolvedValue({
      finalizedBalance: {
        accountAmount: "10000000",
        accountAtDisposal: "9900000",
      },
    });
    getOperations.mockResolvedValue([]);
  });

  describe("getAccountShape", () => {
    it("should return account shape with balance from network", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.balance).toEqual(new BigNumber(10000000));
    });

    it("should return spendable balance from accountAtDisposal", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.spendableBalance).toEqual(new BigNumber(9900000));
    });

    it("should calculate spendable balance from balance minus minReserve when accountAtDisposal is missing", async () => {
      // GIVEN
      getAccountBalance.mockResolvedValue({
        finalizedBalance: {
          accountAmount: "10000000",
        },
      });
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN - 10000000 - 100000 (minReserve) = 9900000
      expect(result.spendableBalance).toEqual(new BigNumber(9900000));
    });

    it("should set freshAddress from network account", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.freshAddress).toBe(VALID_ADDRESS);
    });

    it("should set concordiumResources with isOnboarded true", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.concordiumResources?.isOnboarded).toBe(true);
      expect(result.concordiumResources?.publicKey).toBe(PUBLIC_KEY);
    });

    it("should return empty account shape when no accounts found", async () => {
      // GIVEN
      getAccountsByPublicKey.mockResolvedValue([]);
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.balance).toEqual(new BigNumber(0));
      expect(result.spendableBalance).toEqual(new BigNumber(0));
      expect(result.concordiumResources?.isOnboarded).toBe(false);
      expect(result.used).toBe(false);
    });

    it("should throw on network error when fetching accounts", async () => {
      // GIVEN
      getAccountsByPublicKey.mockRejectedValue(new Error("Network error"));
      const currency = createFixtureCurrency();

      // WHEN & THEN
      await expect(
        getAccountShape({
          currency,
          derivationMode: "",
          derivationPath: "m/1105'/0'/0'/0'/0'/0'",
          index: 0,
          rest: { publicKey: PUBLIC_KEY },
        }),
      ).rejects.toThrow("Network error");
    });

    it("should use publicKey from initialAccount when not in rest", async () => {
      // GIVEN
      const currency = createFixtureCurrency();
      const initialAccount = createTestConcordiumAccount({
        concordiumResources: { isOnboarded: false, publicKey: PUBLIC_KEY },
      });

      // WHEN
      const _result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        initialAccount,
      });

      // THEN
      expect(getAccountsByPublicKey).toHaveBeenCalledWith(currency, PUBLIC_KEY);
    });

    it("should merge operations with existing operations", async () => {
      // GIVEN
      const existingOp = createFixtureOperation({
        id: "op1",
        blockHeight: 100,
        type: "OUT",
      });
      const newOp = {
        id: "op2",
        blockHeight: 101,
        date: new Date(),
        type: "IN",
      };
      getOperations.mockResolvedValue([newOp]);
      const currency = createFixtureCurrency();
      const initialAccount = createTestConcordiumAccount({
        operations: [existingOp],
        concordiumResources: { isOnboarded: false, publicKey: PUBLIC_KEY },
      });

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        initialAccount,
      });

      // THEN
      expect(result.operations.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle getAccountBalance failure gracefully", async () => {
      // GIVEN
      getAccountBalance.mockRejectedValue(new Error("Failed to fetch balance"));
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN - should still return account shape with zero balance
      expect(result.balance).toEqual(new BigNumber(0));
      expect(result.spendableBalance).toEqual(new BigNumber(0));
      expect(result.used).toBe(true); // Account still exists on-chain
      expect(result.concordiumResources?.isOnboarded).toBe(true);
    });

    it("should handle getOperations failure gracefully", async () => {
      // GIVEN
      getOperations.mockRejectedValue(new Error("Failed to fetch operations"));
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN - should still return account shape with empty operations
      expect(result.operations).toEqual([]);
    });

    it("should set used to true when balance is positive", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.used).toBe(true);
    });

    it("should set xpub to publicKey", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.xpub).toBe(PUBLIC_KEY);
    });

    it("should set seedIdentifier to publicKey", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.seedIdentifier).toBe(PUBLIC_KEY);
    });

    it("should preserve derivationMode and derivationPath", async () => {
      // GIVEN
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "concordium",
        derivationPath: "m/1105'/0'/1'/2'/3'/4'",
        index: 5,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.derivationMode).toBe("concordium");
      expect(result.derivationPath).toBe("m/1105'/0'/1'/2'/3'/4'");
      expect(result.index).toBe(5);
    });

    it("should handle negative spendable balance by returning 0", async () => {
      // GIVEN
      getAccountBalance.mockResolvedValue({
        finalizedBalance: {
          accountAmount: "50000", // Less than minReserve
        },
      });
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN - 50000 - 100000 = -50000, should be clamped to 0
      expect(result.spendableBalance).toEqual(new BigNumber(0));
    });

    it("should handle NaN balance values", async () => {
      // GIVEN
      getAccountBalance.mockResolvedValue({
        finalizedBalance: {
          accountAmount: "invalid",
        },
      });
      const currency = createFixtureCurrency();

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.balance).toEqual(new BigNumber(0));
    });

    it("should preserve existing concordiumResources fields", async () => {
      // GIVEN
      const currency = createFixtureCurrency();
      const initialAccount = createTestConcordiumAccount({
        concordiumResources: {
          isOnboarded: false,
          publicKey: PUBLIC_KEY,
          credId: "existing-cred-id",
          identityIndex: 5,
          credNumber: 3,
          ipIdentity: 1,
        },
      });

      // WHEN
      const result = await getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "m/1105'/0'/0'/0'/0'/0'",
        index: 0,
        initialAccount,
        rest: { publicKey: PUBLIC_KEY },
      });

      // THEN
      expect(result.concordiumResources?.credId).toBe("existing-cred-id");
      expect(result.concordiumResources?.identityIndex).toBe(5);
    });
  });
});
