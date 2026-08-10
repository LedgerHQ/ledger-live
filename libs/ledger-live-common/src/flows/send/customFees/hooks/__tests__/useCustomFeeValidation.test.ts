/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../../../../../coin-modules/transaction-types";
import { useCustomFeeValidation } from "../useCustomFeeValidation";

function createNativeAccount(balance: string): Account {
  return {
    id: "eth-account-1",
    type: "Account",
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
  } as Account;
}

function createTokenAccount(parentId: string, balance: string): AccountLike {
  return {
    id: "usdc-account-1",
    parentId,
    type: "TokenAccount",
    balance: new BigNumber(balance),
    spendableBalance: new BigNumber(balance),
  } as AccountLike;
}

function createStatus(): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
  } as TransactionStatus;
}

function createTransaction(amount: string, subAccountId?: string): Transaction {
  return {
    family: "evm",
    amount: new BigNumber(amount),
    useAllAmount: false,
    subAccountId: subAccountId ?? null,
  } as Transaction;
}

const activeInputs = [{ key: "maxFeePerGas", type: "number" as const }] as const;

describe("useCustomFeeValidation", () => {
  it("does not flag insufficient balance when token amount and native fees use different accounts", () => {
    const nativeAccount = createNativeAccount("1000000000000000000");
    const tokenAccount = createTokenAccount(nativeAccount.id, "100000000");

    const { result } = renderHook(() =>
      useCustomFeeValidation({
        account: tokenAccount,
        feePayerAccount: nativeAccount,
        transaction: createTransaction("10000000", tokenAccount.id),
        status: createStatus(),
        activeInputs,
        values: { maxFeePerGas: "10000000000" },
        estimatedFeesForValidation: new BigNumber("210000000000000"),
        bridgeHasInsufficientBalance: false,
        hasCustomFeeConfig: true,
      }),
    );

    expect(result.current.hasInsufficientBalance).toBe(false);
  });

  it("flags insufficient balance when native fee payer cannot cover the estimated fees", () => {
    const nativeAccount = createNativeAccount("1000");
    const tokenAccount = createTokenAccount(nativeAccount.id, "100000000");

    const { result } = renderHook(() =>
      useCustomFeeValidation({
        account: tokenAccount,
        feePayerAccount: nativeAccount,
        transaction: createTransaction("10000000", tokenAccount.id),
        status: createStatus(),
        activeInputs,
        values: { maxFeePerGas: "10000000000" },
        estimatedFeesForValidation: new BigNumber("210000000000000"),
        bridgeHasInsufficientBalance: false,
        hasCustomFeeConfig: true,
      }),
    );

    expect(result.current.hasInsufficientBalance).toBe(true);
  });

  it("compares amount plus fees when sender and fee payer use the same account", () => {
    const nativeAccount = createNativeAccount("1000000000000000000");

    const { result } = renderHook(() =>
      useCustomFeeValidation({
        account: nativeAccount,
        feePayerAccount: nativeAccount,
        transaction: createTransaction("99000000000000000000"),
        status: createStatus(),
        activeInputs,
        values: { maxFeePerGas: "10000000000" },
        estimatedFeesForValidation: new BigNumber("210000000000000"),
        bridgeHasInsufficientBalance: false,
        hasCustomFeeConfig: true,
      }),
    );

    expect(result.current.hasInsufficientBalance).toBe(true);
  });
});
