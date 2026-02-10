import { reconciliateSubAccounts } from "./reconciliation";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("reconciliation", () => {
  const createTokenAccount = (id: string, balance: string): TokenAccount =>
    ({
      type: "TokenAccount",
      id,
      parentId: "parent1",
      token: { id: `token-${id}`, ticker: id },
      balance: new BigNumber(balance),
      spendableBalance: new BigNumber(balance),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      swapHistory: [],
    }) as unknown as TokenAccount;

  describe("reconciliateSubAccounts", () => {
    it("returns token accounts as-is when no initial account", () => {
      const tokenAccounts = [createTokenAccount("token1", "1000"), createTokenAccount("token2", "2000")];

      const result = reconciliateSubAccounts(tokenAccounts, undefined);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("token1");
      expect(result[1].id).toBe("token2");
    });

    it("preserves existing token accounts when properties match", () => {
      const existingToken = createTokenAccount("token1", "1000");
      const newToken = existingToken; // Same reference
      
      const initialAccount = {
        subAccounts: [existingToken],
      } as unknown as Account;

      const result = reconciliateSubAccounts([newToken], initialAccount);

      expect(result[0]).toBe(existingToken);
    });

    it("updates token account when properties differ", () => {
      const existingToken = createTokenAccount("token1", "1000");
      const newToken = createTokenAccount("token1", "2000"); // Different balance

      const initialAccount = {
        subAccounts: [existingToken],
      } as unknown as Account;

      const result = reconciliateSubAccounts([newToken], initialAccount);

      expect(result[0]).toBe(newToken);
      expect(result[0].balance.toString()).toBe("2000");
    });

    it("detects new token accounts", () => {
      const existingToken = createTokenAccount("token1", "1000");
      const newToken = createTokenAccount("token2", "2000");

      const initialAccount = {
        subAccounts: [existingToken],
      } as unknown as Account;

      const result = reconciliateSubAccounts([existingToken, newToken], initialAccount);

      expect(result).toHaveLength(2);
    });

    it("detects length change", () => {
      const existingToken = createTokenAccount("token1", "1000");
      const newToken1 = createTokenAccount("token1", "1000");
      const newToken2 = createTokenAccount("token2", "2000");

      const initialAccount = {
        subAccounts: [existingToken],
      } as unknown as Account;

      const result = reconciliateSubAccounts([newToken1, newToken2], initialAccount);

      expect(result).toHaveLength(2);
    });

    it("returns initial subAccounts when nothing changed", () => {
      const existingToken = createTokenAccount("token1", "1000");

      const initialAccount = {
        subAccounts: [existingToken],
      } as unknown as Account;

      // Pass the exact same token account
      const result = reconciliateSubAccounts([existingToken], initialAccount);

      expect(result).toBe(initialAccount.subAccounts);
    });

    it("handles empty initial subAccounts", () => {
      const newToken = createTokenAccount("token1", "1000");

      const initialAccount = {
        subAccounts: undefined,
      } as unknown as Account;

      const result = reconciliateSubAccounts([newToken], initialAccount);

      expect(result).toHaveLength(1);
    });
  });
});
