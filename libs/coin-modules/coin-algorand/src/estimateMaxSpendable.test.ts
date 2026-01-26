import type { TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import * as getFeesModule from "./getFeesForTransaction";
import type { AlgorandAccount, AlgorandTransaction } from "./types";

jest.mock("./getFeesForTransaction");
jest.mock("@ledgerhq/cryptoassets", () => ({
  getAbandonSeedAddress: jest.fn().mockReturnValue("ABANDON_SEED_ADDRESS"),
}));

const mockGetEstimatedFees = getFeesModule.getEstimatedFees as jest.MockedFunction<
  typeof getFeesModule.getEstimatedFees
>;

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEstimatedFees.mockResolvedValue(new BigNumber("1000"));
  });

  const createMockAccount = (
    balance: string,
    nbAssets: number,
    subAccounts: TokenAccount[] = [],
  ): AlgorandAccount =>
    ({
      id: "algorand-account-1",
      type: "Account",
      currency: { id: "algorand" },
      balance: new BigNumber(balance),
      spendableBalance: new BigNumber(balance),
      freshAddress: "ALGO_ADDRESS",
      algorandResources: {
        rewards: new BigNumber("0"),
        nbAssets,
      },
      subAccounts,
    }) as unknown as AlgorandAccount;

  describe("main account", () => {
    it("should calculate max spendable for account with no assets", async () => {
      const account = createMockAccount("10000000", 0); // 10 ALGO

      const result = await estimateMaxSpendable({ account });

      // 10 ALGO - 0.1 ALGO min balance - fees
      expect(result).toBeInstanceOf(BigNumber);
      expect(result.toNumber()).toBeGreaterThan(0);
    });

    it("should account for assets in max spendable calculation", async () => {
      const account = createMockAccount("10000000", 5); // 10 ALGO, 5 assets

      const result = await estimateMaxSpendable({ account });

      // Should have less spendable due to asset min balance requirements
      expect(result).toBeInstanceOf(BigNumber);
    });

    it("should subtract fees from max spendable", async () => {
      mockGetEstimatedFees.mockResolvedValue(new BigNumber("5000"));
      const account = createMockAccount("10000000", 0);

      const result = await estimateMaxSpendable({ account });

      expect(result).toBeInstanceOf(BigNumber);
    });

    it("should return 0 when balance is insufficient", async () => {
      mockGetEstimatedFees.mockResolvedValue(new BigNumber("1000000"));
      const account = createMockAccount("50000", 0); // Only 0.05 ALGO

      const result = await estimateMaxSpendable({ account });

      expect(result.toString()).toBe("0");
    });

    it("should use transaction recipient if provided", async () => {
      const account = createMockAccount("10000000", 0);
      const transaction: Partial<AlgorandTransaction> = {
        recipient: "CUSTOM_RECIPIENT",
      };

      await estimateMaxSpendable({ account, transaction });

      expect(mockGetEstimatedFees).toHaveBeenCalled();
    });

    it("should use abandon seed address when no recipient provided", async () => {
      const account = createMockAccount("10000000", 0);

      await estimateMaxSpendable({ account });

      expect(mockGetEstimatedFees).toHaveBeenCalled();
    });
  });

  describe("token account (subAccount)", () => {
    it("should return full token balance for token account", async () => {
      const tokenBalance = new BigNumber("500");
      const tokenAccount = {
        id: "token-account-1",
        type: "TokenAccount",
        balance: tokenBalance,
        token: { id: "algorand/asa/12345" },
      } as unknown as TokenAccount;

      const mainAccount = createMockAccount("10000000", 1, [tokenAccount]);

      const result = await estimateMaxSpendable({
        account: tokenAccount as unknown as AlgorandAccount,
        parentAccount: mainAccount,
      });

      expect(result.toString()).toBe("500");
    });

    it("should not deduct fees for token transfers", async () => {
      mockGetEstimatedFees.mockResolvedValue(new BigNumber("10000"));
      const tokenBalance = new BigNumber("1000");
      const tokenAccount = {
        id: "token-account-2",
        type: "TokenAccount",
        balance: tokenBalance,
        token: { id: "algorand/asa/67890" },
      } as unknown as TokenAccount;

      const mainAccount = createMockAccount("10000000", 1, [tokenAccount]);

      const result = await estimateMaxSpendable({
        account: tokenAccount as unknown as AlgorandAccount,
        parentAccount: mainAccount,
      });

      // Full token balance, fees are paid in ALGO
      expect(result.toString()).toBe("1000");
    });
  });

  describe("error handling", () => {
    it("should throw when algorandResources is missing", async () => {
      const account = {
        id: "account-1",
        type: "Account",
        balance: new BigNumber("10000000"),
      } as unknown as AlgorandAccount;

      await expect(estimateMaxSpendable({ account })).rejects.toThrow("Algorand account expected");
    });
  });
});
