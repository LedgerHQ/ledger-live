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
  it("reports the gas budget (not the net fee) as estimatedFees and totals against it", async () => {
    // estimatedFees is the value Ledger Live declares to the device's Exchange app on a swap/sell
    // (completeExchange → processTransaction) and shows at confirmation. It MUST equal the gas budget
    // committed in the signed tx — the Sui app verifies expected.fee == received.fee, so declaring
    // the smaller net fee made the device reject swaps with UNKNOWN_ERROR (0x6e05). The accurate net
    // gas is carried by transaction.fees and used only for the optimistic op (see signOperation).
    const transaction = createFixtureTransaction({
      mode: "delegate",
      amount: BigNumber(1_000_000_000), // 1 SUI
      fees: BigNumber(9_759_296), // accurate net gas (~0.00976 SUI)
      gasBudget: BigNumber(100_000_000), // 0.1 SUI reservation = what the device parses
    });
    const result = await getTransactionStatus(account, transaction);

    expect(result.estimatedFees).toEqual(BigNumber(100_000_000)); // the gas budget
    expect(result.totalSpent).toEqual(BigNumber(1_100_000_000)); // amount + gas budget
    expect(result.errors.amount).toBeUndefined(); // ~18 SUI balance covers 1 + 0.1 budget
  });
  it("token.send (swap path): estimatedFees equals the gas budget declared to the device", async () => {
    // The swap/sell flow declares getTransactionStatus().estimatedFees to the device's Exchange app.
    // For a USDC(Sui) token transfer it must equal the gas budget in the signed tx, otherwise the
    // Sui app rejects the swap with UNKNOWN_ERROR (0x6e05). Regression guard for that invariant.
    const transaction = createFixtureTransaction({
      mode: "token.send",
      subAccountId: "js:2:sui:0x6e143fe0:+sui%2Fcoin%2Fusdc",
      coinType: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      amount: BigNumber(30_000_000), // token amount (USDC), not SUI
      fees: BigNumber(2_500_000), // accurate net gas (smaller)
      gasBudget: BigNumber(5_000_000), // gas budget = what the device parses
    });
    const result = await getTransactionStatus(account, transaction);

    expect(result.estimatedFees).toEqual(BigNumber(5_000_000)); // the gas budget, not 2_500_000
  });
  it('falls back to the net fee when the gas budget is present but zero (GraphQL dry-run returns "0")', async () => {
    // simulateTransactionGraphQL defaults gasBudget to "0" when gasInput.gasBudget is absent. A
    // BigNumber(0) is truthy, so `gasBudget || fees` would wrongly keep the zero budget; estimatedFees
    // must clamp up to the non-zero net fee instead of staying 0.
    const transaction = createFixtureTransaction({
      amount: BigNumber(1_000_000_000),
      fees: BigNumber(2_500_000),
      gasBudget: BigNumber(0),
    });
    const result = await getTransactionStatus(account, transaction);

    expect(result.estimatedFees).toEqual(BigNumber(2_500_000)); // net fee, not the zero budget
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
