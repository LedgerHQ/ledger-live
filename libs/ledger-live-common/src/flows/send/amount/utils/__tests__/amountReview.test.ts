import { BigNumber } from "bignumber.js";
import { getMaxAvailable, isInsufficientFundsAmountError } from "../amountReview";
import type { TransactionStatus } from "../../../../../generated/types";
import { AccountLike } from "@ledgerhq/types-live";

function makeStatus(amountError?: { name: string }): TransactionStatus {
  return {
    errors: amountError ? { amount: amountError as Error } : {},
  } as TransactionStatus;
}

describe("getMaxAvailable", () => {
  it("returns 0 when account is null", () => {
    expect(getMaxAvailable(null, new BigNumber(10)).toNumber()).toBe(0);
  });

  it("returns 0 when account is undefined", () => {
    expect(getMaxAvailable(undefined, new BigNumber(10)).toNumber()).toBe(0);
  });

  it("returns balance minus fees when no spendableBalance", () => {
    const account = {
      balance: new BigNumber(100),
    };
    expect(getMaxAvailable(account as unknown as AccountLike, new BigNumber(10)).toNumber()).toBe(
      90,
    );
  });

  it("uses spendableBalance when present", () => {
    const account = {
      balance: new BigNumber(100),
      spendableBalance: new BigNumber(80),
    };
    expect(getMaxAvailable(account as unknown as AccountLike, new BigNumber(5)).toNumber()).toBe(
      75,
    );
  });

  it("returns 0 when fees exceed balance", () => {
    const account = {
      balance: new BigNumber(10),
    };
    expect(getMaxAvailable(account as unknown as AccountLike, new BigNumber(20)).toNumber()).toBe(
      0,
    );
  });

  it("returns 0 when estimatedFees is zero and balance is zero", () => {
    const account = {
      balance: new BigNumber(0),
    };
    expect(getMaxAvailable(account as unknown as AccountLike, new BigNumber(0)).toNumber()).toBe(0);
  });
});

describe("isInsufficientFundsAmountError", () => {
  it("returns false when status has no amount error", () => {
    expect(isInsufficientFundsAmountError(makeStatus())).toBe(false);
    expect(isInsufficientFundsAmountError(makeStatus(undefined))).toBe(false);
  });

  it("returns true for NotEnoughBalance", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "NotEnoughBalance" }))).toBe(true);
  });

  it("returns true for NotEnoughBalanceFees", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "NotEnoughBalanceFees" }))).toBe(true);
  });

  it("returns true for NotEnoughBalanceSwap", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "NotEnoughBalanceSwap" }))).toBe(true);
  });

  it("returns true for NotEnoughBalanceBecauseDestinationNotCreated", () => {
    expect(
      isInsufficientFundsAmountError(
        makeStatus({ name: "NotEnoughBalanceBecauseDestinationNotCreated" }),
      ),
    ).toBe(true);
  });

  it("returns true for NotEnoughBalanceInParentAccount", () => {
    expect(
      isInsufficientFundsAmountError(makeStatus({ name: "NotEnoughBalanceInParentAccount" })),
    ).toBe(true);
  });

  it("returns true for NotEnoughBalanceToDelegate", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "NotEnoughBalanceToDelegate" }))).toBe(
      true,
    );
  });

  it("returns true when error name includes Insufficient", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "InsufficientLiquidity" }))).toBe(
      true,
    );
  });

  it("returns false for AmountRequired", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "AmountRequired" }))).toBe(false);
  });

  it("returns false for other error names", () => {
    expect(isInsufficientFundsAmountError(makeStatus({ name: "InvalidAddress" }))).toBe(false);
  });
});
