import { describe, it, expect, beforeEach } from "@jest/globals";
import { Account, TokenAccount, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { prepareSaveSwapToHistory, PrepareSaveSwapProps } from "./prepareSaveSwapToHistory";

describe("prepareSaveSwapToHistory", () => {
  let mockAccount: Account;
  let mockTokenAccount: TokenAccount;
  let mockToAccount: Account;
  let accounts: AccountLike[];
  let validProps: PrepareSaveSwapProps;

  beforeEach(() => {
    mockAccount = {
      id: "account-1",
      type: "Account",
      swapHistory: [],
    } as Account;

    mockTokenAccount = {
      id: "token-account-1",
      type: "TokenAccount",
      swapHistory: [],
      parentId: "account-1",
    } as TokenAccount;

    mockToAccount = {
      id: "account-2",
      type: "Account",
      swapHistory: [],
    } as Account;

    accounts = [mockAccount, mockTokenAccount, mockToAccount];

    validProps = {
      provider: "1inch",
      fromAccountId: "account-1",
      toAccountId: "account-2",
      fromAmount: new BigNumber("100"),
      toAmount: new BigNumber("200"),
      swapId: "swap-123",
      transactionId: "tx-456",
    };
  });

  it("should throw error when missing required params", () => {
    const invalidProps = { ...validProps, swapId: undefined };
    expect(() => prepareSaveSwapToHistory(accounts, invalidProps as PrepareSaveSwapProps)).toThrow(
      "Cannot save swap missing params",
    );
  });

  it("should throw error when accounts not found", () => {
    const props = { ...validProps, fromAccountId: "unknown-account" };
    expect(() => prepareSaveSwapToHistory(accounts, props)).toThrow(
      "accountId unknown-account unknown",
    );
  });

  it("should return correct accountId for regular account", () => {
    const result = prepareSaveSwapToHistory(accounts, validProps);
    expect(result.accountId).toBe("account-1");
  });

  it("should update swapHistory for matching account", () => {
    const result = prepareSaveSwapToHistory(accounts, validProps);
    const updated = result.updater(mockAccount);
    expect(updated.swapHistory).toHaveLength(1);
    expect(updated.swapHistory[0].provider).toBe("1inch");
    expect(updated.swapHistory[0].swapId).toBe("swap-123");
  });

  it("should add swap operation to updater for non-matching account", () => {
    const result = prepareSaveSwapToHistory(accounts, validProps);
    const updated = result.updater(mockToAccount);
    expect(updated.id).toBe("account-2");
  });
});
