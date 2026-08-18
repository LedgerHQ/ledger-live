import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
} from "@ledgerhq/ledger-wallet-framework/errors";

import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getTransactionStatus from "./getTransactionStatus";
import { ONE_SUI } from "../constants";
import {
  OneSuiMinForStake,
  OneSuiMinForUnstake,
  OneSuiMinForUnstakeToBeLeft,
  SuiStakeNotFound,
} from "../errors";

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

  // Move enforces these: `validator_set::request_add_stake` aborts `EStakingBelowThreshold` (10)
  // below 1 SUI, and `staking_pool::split` aborts `EStakedSuiBelowThreshold` (18) unless BOTH the
  // withdrawn amount and the remainder reach 1 SUI. Reaching the chain costs gas and surfaces a raw
  // MoveAbort, so these must fail here first.
  describe("minimum stake thresholds", () => {
    const STAKED_SUI_ID = "0xstake1";

    const accountWithStake = (principal: string) =>
      createFixtureAccount({
        suiResources: {
          nonce: 0,
          stakes: [{ stakes: [{ stakedSuiId: STAKED_SUI_ID, principal }] }],
        },
      });

    it("rejects a delegation below 1 SUI", async () => {
      const transaction = createFixtureTransaction({
        mode: "delegate",
        amount: BigNumber(ONE_SUI / 2),
      });
      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.amount).toEqual(new OneSuiMinForStake());
    });

    it("accepts a delegation of exactly 1 SUI", async () => {
      const transaction = createFixtureTransaction({
        mode: "delegate",
        amount: BigNumber(ONE_SUI),
      });
      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.amount).toBeUndefined();
    });

    // The QA case: 0.25 SUI out of a 1 SUI position. Both `split` asserts fail, and the remainder
    // one is the more specific message.
    it("rejects an unstake that would leave less than 1 SUI in the position", async () => {
      const transaction = createFixtureTransaction({
        mode: "undelegate",
        stakedSuiId: STAKED_SUI_ID,
        amount: BigNumber(ONE_SUI / 4),
      });
      const result = await getTransactionStatus(accountWithStake(String(ONE_SUI)), transaction);

      expect(result.errors.amount).toEqual(new OneSuiMinForUnstakeToBeLeft());
    });

    it("rejects an unstake below 1 SUI even when the remainder is large", async () => {
      const transaction = createFixtureTransaction({
        mode: "undelegate",
        stakedSuiId: STAKED_SUI_ID,
        amount: BigNumber(ONE_SUI / 2),
      });
      const result = await getTransactionStatus(accountWithStake(String(3 * ONE_SUI)), transaction);

      expect(result.errors.amount).toEqual(new OneSuiMinForUnstake());
    });

    it("accepts a partial unstake leaving at least 1 SUI on both sides", async () => {
      const transaction = createFixtureTransaction({
        mode: "undelegate",
        stakedSuiId: STAKED_SUI_ID,
        amount: BigNumber(1.5 * ONE_SUI),
      });
      const result = await getTransactionStatus(accountWithStake(String(3 * ONE_SUI)), transaction);

      expect(result.errors.amount).toBeUndefined();
    });

    // A stale, degraded, or cleared sync can lose the position, and nothing downstream catches what
    // this guard lets through.
    describe("when the position is missing from the synced stakes", () => {
      it("still rejects a partial unstake below 1 SUI", async () => {
        const transaction = createFixtureTransaction({
          mode: "undelegate",
          stakedSuiId: "0xnot-synced",
          amount: BigNumber(ONE_SUI / 4),
        });
        const result = await getTransactionStatus(accountWithStake(String(ONE_SUI)), transaction);

        expect(result.errors.amount).toEqual(new OneSuiMinForUnstake());
      });

      // The remainder cannot be computed without the principal, so an otherwise legal-looking amount
      // must not proceed.
      it("blocks a partial unstake whose remainder cannot be verified", async () => {
        const transaction = createFixtureTransaction({
          mode: "undelegate",
          stakedSuiId: "0xnot-synced",
          amount: BigNumber(2 * ONE_SUI),
        });
        const result = await getTransactionStatus(
          accountWithStake(String(3 * ONE_SUI)),
          transaction,
        );

        expect(result.errors.amount).toEqual(new SuiStakeNotFound());
      });

      it("blocks a partial unstake when the account carries no stakes at all", async () => {
        const transaction = createFixtureTransaction({
          mode: "undelegate",
          stakedSuiId: STAKED_SUI_ID,
          amount: BigNumber(2 * ONE_SUI),
        });
        const result = await getTransactionStatus(account, transaction);

        expect(result.errors.amount).toEqual(new SuiStakeNotFound());
      });

      // A full withdrawal never splits, so it stays legal without the principal.
      it("allows a full unstake", async () => {
        const transaction = createFixtureTransaction({
          mode: "undelegate",
          stakedSuiId: "0xnot-synced",
          amount: BigNumber(ONE_SUI),
          useAllAmount: true,
        });
        const result = await getTransactionStatus(accountWithStake(String(ONE_SUI)), transaction);

        expect(result.errors.amount).toBeUndefined();
      });
    });

    // A full withdrawal takes the no-split path on chain, so the thresholds do not apply — this is
    // the only legal unstake for a 1 SUI position.
    it("accepts a full unstake of a 1 SUI position", async () => {
      const transaction = createFixtureTransaction({
        mode: "undelegate",
        stakedSuiId: STAKED_SUI_ID,
        amount: BigNumber(ONE_SUI),
        useAllAmount: true,
      });
      const result = await getTransactionStatus(accountWithStake(String(ONE_SUI)), transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });
});
