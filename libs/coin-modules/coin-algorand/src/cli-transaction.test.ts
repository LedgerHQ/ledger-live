import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import makeCliTools from "./cli-transaction";
import type { AlgorandAccount, Transaction } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  getAccountCurrency: jest.fn((account: TokenAccount) => account.token),
}));

describe("cli-transaction", () => {
  const cliTools = makeCliTools();

  describe("makeCliTools", () => {
    it("should return object with options, inferAccounts, and inferTransactions", () => {
      expect(cliTools).toHaveProperty("options");
      expect(cliTools).toHaveProperty("inferAccounts");
      expect(cliTools).toHaveProperty("inferTransactions");
    });
  });

  describe("options", () => {
    it("should include mode option", () => {
      const modeOption = cliTools.options.find(o => o.name === "mode");
      expect(modeOption).not.toBeUndefined();
      expect(modeOption?.type).toBe(String);
      expect(modeOption?.desc).toContain("send");
      expect(modeOption?.desc).toContain("optIn");
      expect(modeOption?.desc).toContain("claimReward");
    });

    it("should include fees option", () => {
      const feesOption = cliTools.options.find(o => o.name === "fees");
      expect(feesOption).not.toBeUndefined();
      expect(feesOption?.type).toBe(String);
    });

    it("should include gasLimit option", () => {
      const gasLimitOption = cliTools.options.find(o => o.name === "gasLimit");
      expect(gasLimitOption).not.toBeUndefined();
      expect(gasLimitOption?.type).toBe(String);
    });

    it("should include memo option", () => {
      const memoOption = cliTools.options.find(o => o.name === "memo");
      expect(memoOption).not.toBeUndefined();
      expect(memoOption?.type).toBe(String);
    });

    it("should include token option with alias and multiple", () => {
      const tokenOption = cliTools.options.find(o => o.name === "token");
      expect(tokenOption).not.toBeUndefined();
      expect(tokenOption?.alias).toBe("t");
      expect(tokenOption?.type).toBe(String);
      expect(tokenOption?.multiple).toBe(true);
    });
  });

  describe("inferAccounts", () => {
    const createMockAccount = (subAccounts: TokenAccount[] = []): Account =>
      ({
        id: "algorand-account-1",
        currency: { family: "algorand" },
        subAccounts,
      }) as unknown as Account;

    const createMockTokenAccount = (ticker: string, id: string): TokenAccount =>
      ({
        type: "TokenAccount",
        id: `algorand-account-1+${id}`,
        token: { ticker, id: `algorand/asa/${id}` },
      }) as unknown as TokenAccount;

    it("should return main account when no token option", () => {
      const account = createMockAccount();

      const result = cliTools.inferAccounts(account, {});

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(account);
    });

    it("should return main account for optIn mode even with token option", () => {
      const account = createMockAccount();

      const result = cliTools.inferAccounts(account, { token: ["USDC"], mode: "optIn" });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(account);
    });

    it("should find token account by ticker (case insensitive)", () => {
      const tokenAccount = createMockTokenAccount("USDC", "12345");
      const account = createMockAccount([tokenAccount]);

      const result = cliTools.inferAccounts(account, { token: ["usdc"] });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(tokenAccount);
    });

    it("should find token account by asset ID", () => {
      const tokenAccount = createMockTokenAccount("USDC", "12345");
      const account = createMockAccount([tokenAccount]);

      const result = cliTools.inferAccounts(account, { token: ["12345"] });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(tokenAccount);
    });

    it("should throw error when token account not found", () => {
      const account = createMockAccount([]);

      expect(() => cliTools.inferAccounts(account, { token: ["UNKNOWN"] })).toThrow(
        "token account 'UNKNOWN' not found",
      );
    });

    it("should list available tokens in error message", () => {
      const tokenAccount1 = createMockTokenAccount("USDC", "12345");
      const tokenAccount2 = createMockTokenAccount("USDT", "67890");
      const account = createMockAccount([tokenAccount1, tokenAccount2]);

      expect(() => cliTools.inferAccounts(account, { token: ["UNKNOWN"] })).toThrow(
        /Available: USDC, USDT/,
      );
    });

    it("should handle multiple token options", () => {
      const tokenAccount1 = createMockTokenAccount("USDC", "12345");
      const tokenAccount2 = createMockTokenAccount("USDT", "67890");
      const account = createMockAccount([tokenAccount1, tokenAccount2]);

      const result = cliTools.inferAccounts(account, { token: ["USDC", "USDT"] });

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(tokenAccount1);
      expect(result[1]).toBe(tokenAccount2);
    });

    it("should throw invariant error for non-algorand account", () => {
      const account = {
        currency: { family: "bitcoin" },
      } as unknown as Account;

      expect(() => cliTools.inferAccounts(account, {})).toThrow();
    });
  });

  describe("inferTransactions", () => {
    const createMockAlgorandAccount = (): AlgorandAccount =>
      ({
        type: "Account",
        id: "algorand-account-1",
        algorandResources: {
          rewards: new BigNumber("0"),
          nbAssets: 0,
        },
      }) as unknown as AlgorandAccount;

    const createMockTokenAccount = (): TokenAccount =>
      ({
        type: "TokenAccount",
        id: "algorand-account-1+12345",
        token: { ticker: "USDC", id: "algorand/asa/12345", delisted: false },
      }) as unknown as TokenAccount;

    const createMockTransaction = (): Transaction =>
      ({
        family: "algorand",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
      }) as Transaction;

    const mockInferAmount = jest.fn().mockReturnValue(new BigNumber("1000"));

    it("should set default mode to send", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].mode).toBe("send");
    });

    it("should use provided mode", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        { mode: "optIn" },
        { inferAmount: mockInferAmount },
      );

      expect(result[0].mode).toBe("optIn");
    });

    it("should set memo from options", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        { memo: "test memo" },
        { inferAmount: mockInferAmount },
      );

      expect(result[0].memo).toBe("test memo");
    });

    it("should infer fees when provided", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        { fees: "1000" },
        { inferAmount: mockInferAmount },
      );

      expect(mockInferAmount).toHaveBeenCalledWith(account, "1000");
      expect(result[0].fees).toEqual(new BigNumber("1000"));
    });

    it("should set fees to null when not provided", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].fees).toBeNull();
    });

    it("should set subAccountId for token account", () => {
      const tokenAccount = createMockTokenAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account: tokenAccount, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].subAccountId).toBe("algorand-account-1+12345");
    });

    it("should set subAccountId to null for main account", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].subAccountId).toBeNull();
    });

    it("should set assetId from token option", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        { token: "12345" },
        { inferAmount: mockInferAmount },
      );

      expect(result[0].assetId).toBe("algorand/asa/12345");
    });

    it("should set assetId to null when no token option", () => {
      const account = createMockAlgorandAccount();
      const transaction = createMockTransaction();

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].assetId).toBeNull();
    });

    it("should throw invariant error for non-algorand transaction", () => {
      const account = createMockAlgorandAccount();
      const transaction = { family: "bitcoin" } as unknown as Transaction;

      expect(() =>
        cliTools.inferTransactions(
          [{ account, transaction }],
          {},
          { inferAmount: mockInferAmount },
        ),
      ).toThrow();
    });

    it("should throw invariant error for unactivated account", () => {
      const account = {
        type: "Account",
        algorandResources: undefined,
      } as unknown as AlgorandAccount;
      const transaction = createMockTransaction();

      expect(() =>
        cliTools.inferTransactions(
          [{ account, transaction }],
          {},
          { inferAmount: mockInferAmount },
        ),
      ).toThrow("unactivated account");
    });

    it("should throw invariant error for delisted token", () => {
      const tokenAccount = {
        type: "TokenAccount",
        id: "token-1",
        token: { ticker: "DELISTED", delisted: true },
      } as unknown as TokenAccount;
      const transaction = createMockTransaction();

      expect(() =>
        cliTools.inferTransactions(
          [{ account: tokenAccount, transaction }],
          {},
          { inferAmount: mockInferAmount },
        ),
      ).toThrow("token is delisted");
    });

    it("should handle multiple transactions", () => {
      const account1 = createMockAlgorandAccount();
      const account2 = createMockAlgorandAccount();
      const transaction1 = createMockTransaction();
      const transaction2 = createMockTransaction();

      const result = cliTools.inferTransactions(
        [
          { account: account1, transaction: transaction1 },
          { account: account2, transaction: transaction2 },
        ],
        { mode: "send" },
        { inferAmount: mockInferAmount },
      );

      expect(result).toHaveLength(2);
      expect(result[0].mode).toBe("send");
      expect(result[1].mode).toBe("send");
    });

    it("should preserve original transaction properties", () => {
      const account = createMockAlgorandAccount();
      const transaction = {
        ...createMockTransaction(),
        amount: new BigNumber("5000000"),
        recipient: "CUSTOM_RECIPIENT",
      };

      const result = cliTools.inferTransactions(
        [{ account, transaction }],
        {},
        { inferAmount: mockInferAmount },
      );

      expect(result[0].amount.toString()).toBe("5000000");
      expect(result[0].recipient).toBe("CUSTOM_RECIPIENT");
    });
  });
});
