import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
} from "@ledgerhq/errors";

import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getTransactionStatus from "./getTransactionStatus";

const account = createFixtureAccount();

describe("getTransactionStatus", () => {
  it("should return errors if recipient empty", async () => {
    const transaction = createFixtureTransaction({ recipient: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new RecipientRequired() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if recipient is invalid sui adress", async () => {
    const transaction = createFixtureTransaction({ recipient: "notValidSuiAddress" });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new InvalidAddress() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if recipient equals to sender", async () => {
    const transaction = createFixtureTransaction({ recipient: account.freshAddress });
    const result = await getTransactionStatus(account, transaction);

    const expected = { recipient: new InvalidAddressBecauseDestinationIsAlsoSource() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if amount not provided", async () => {
    const transaction = createFixtureTransaction({ amount: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { amount: new AmountRequired() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors if amount exceeds balance", async () => {
    const transaction = createFixtureTransaction({ amount: account.balance.plus(1) });
    const result = await getTransactionStatus(account, transaction);

    const expected = { amount: new NotEnoughBalance() };
    expect(result.errors).toEqual(expected);
  });
  it("should return errors fees not loaded", async () => {
    const transaction = createFixtureTransaction({ fees: null });
    const result = await getTransactionStatus(account, transaction);

    const expected = { fees: new FeeNotLoaded() };
    expect(result.errors).toEqual(expected);
  });
  it("reports the accurate fee (not the gas budget) as estimatedFees and totals against it", async () => {
    // Delegate: accurate dry-run gas (~0.00976 SUI) vs reserved budget (0.1 SUI). The displayed fee
    // + total must use the accurate fee so the optimistic op matches the eventually-synced op.
    const transaction = createFixtureTransaction({
      mode: "delegate",
      amount: BigNumber(1_000_000_000), // 1 SUI
      fees: BigNumber(9_759_296), // accurate gas
      gasBudget: BigNumber(100_000_000), // 0.1 SUI reservation
    });
    const result = await getTransactionStatus(account, transaction);

    expect(result.estimatedFees).toEqual(BigNumber(9_759_296));
    expect(result.totalSpent).toEqual(BigNumber(1_009_759_296)); // amount + accurate fee
    expect(result.errors.amount).toBeUndefined(); // ~18 SUI balance covers 1 + 0.1 budget
  });
  it("validates available balance against the gas budget, not the smaller accurate fee", async () => {
    // 1.05 SUI covers amount + accurate fee (1.00976) but NOT amount + budget (1.1): Sui requires
    // the gas coins to cover the budget, so this must still be flagged NotEnoughBalance.
    const lowBalanceAccount = createFixtureAccount({
      balance: BigNumber(1_050_000_000),
      spendableBalance: BigNumber(1_050_000_000),
    });
    const transaction = createFixtureTransaction({
      mode: "delegate",
      amount: BigNumber(1_000_000_000),
      fees: BigNumber(9_759_296),
      gasBudget: BigNumber(100_000_000),
    });
    const result = await getTransactionStatus(lowBalanceAccount, transaction);

    expect(result.errors.amount).toEqual(new NotEnoughBalance());
  });
  it("flags NotEnoughBalance when the address balance can't cover amount + gas and real coins are too small for gas (SIP-58)", async () => {
    // Real coins can't cover the gas budget, so gas is withdrawn from the address balance
    // alongside the transfer. The address balance can't cover amount + gas even though the total
    // can — so the send must be blocked before signing (it would otherwise fail at broadcast with
    // "Invalid withdraw reservation").
    const acc = createFixtureAccount({
      balance: BigNumber(100_001_000_000),
      spendableBalance: BigNumber(100_001_000_000),
      suiResources: { fundsInAddressBalance: BigNumber(100_000_000_000) },
    });
    const transaction = createFixtureTransaction({
      amount: BigNumber(99_999_000_000),
      fees: BigNumber(1_000_000),
      gasBudget: BigNumber(2_000_000),
    });
    const result = await getTransactionStatus(acc, transaction);

    expect(result.errors.amount).toEqual(new NotEnoughBalance());
  });
  it("does not apply the SIP-58 guard when real coins cover the gas budget", async () => {
    // Same near-address-balance amount, but real coins (5 SUI) comfortably cover gas, so gas is
    // paid from them and the address balance only funds the transfer — the send is valid.
    const acc = createFixtureAccount({
      balance: BigNumber(105_000_000_000),
      spendableBalance: BigNumber(105_000_000_000),
      suiResources: { fundsInAddressBalance: BigNumber(100_000_000_000) },
    });
    const transaction = createFixtureTransaction({
      amount: BigNumber(99_999_000_000),
      fees: BigNumber(1_000_000),
      gasBudget: BigNumber(2_000_000),
    });
    const result = await getTransactionStatus(acc, transaction);

    expect(result.errors.amount).toBeUndefined();
  });
  it("should return errors if not enought balance for fees", async () => {
    const transaction = createFixtureTransaction({
      subAccountId: "subAccountId",
    });
    const account = createFixtureAccount({
      id: "parentAccountId",
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      subAccounts: [
        createFixtureAccount({
          id: "subAccountId",
          parentId: "parentAccountId",
          type: "TokenAccount",
        }),
      ],
    });
    const result = await getTransactionStatus(account, transaction);

    const expected = { amount: new NotEnoughBalanceInParentAccount() };
    expect(result.errors).toEqual(expected);
  });
});
