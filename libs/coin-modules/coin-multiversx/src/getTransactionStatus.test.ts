import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import {
  MultiversXDecimalsLimitReached,
  MultiversXDelegationBelowMinimumError,
  MultiversXMinDelegatedAmountError,
  MultiversXMinUndelegatedAmountError,
  NotEnoughEGLDForFees,
} from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import {
  ACCOUNT_ADDRESS,
  buildAccount,
  buildDelegation,
  buildTokenAccount,
  buildTransaction,
  DELEGATION_CONTRACT,
} from "./test/fixtures";

describe("getTransactionStatus", () => {
  describe("recipient", () => {
    it("requires a recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects a recipient equal to the sender", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: ACCOUNT_ADDRESS }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("rejects an invalid bech32 recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "invalidADDRESS" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("accepts a valid recipient", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction());

      expect(status.errors).toEqual({});
    });
  });

  describe("amount and fees", () => {
    it("requires an amount for a send", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("does not require an amount when using all the amount", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status.errors.amount).toBeUndefined();
    });

    it.each(["withdraw", "reDelegateRewards", "claimRewards"] as const)(
      "does not require an amount for %s",
      async mode => {
        const status = await getTransactionStatus(
          buildAccount(),
          buildTransaction({ mode, recipient: DELEGATION_CONTRACT, amount: new BigNumber(0) }),
        );

        expect(status.errors.amount).toBeUndefined();
      },
    );

    it("requires the fees to be loaded", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction({ fees: null }));

      expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });

    it("warns when the fees exceed a tenth of the amount", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(100), fees: new BigNumber(50000) }),
      );

      expect(status.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });

    it("reports the amount, fees and total spent of a send", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(100000000), fees: new BigNumber(50000) }),
      );

      expect({
        amount: status.amount.toString(),
        estimatedFees: status.estimatedFees.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ amount: "100000000", estimatedFees: "50000", totalSpent: "100050000" });
    });
  });

  describe("balance", () => {
    it("reports NotEnoughBalance when the amount exceeds the EGLD balance", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber("1e24") }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports NotEnoughBalance when the amount exceeds the ESDT balance", async () => {
      const account = buildAccount({ withToken: true });
      const status = await getTransactionStatus(
        account,
        buildTransaction({
          subAccountId: buildTokenAccount().id,
          amount: new BigNumber("1e24"),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports the token amount and the EGLD fees of an ESDT send", async () => {
      const account = buildAccount({ withToken: true });
      const status = await getTransactionStatus(
        account,
        buildTransaction({
          subAccountId: buildTokenAccount().id,
          amount: new BigNumber(10),
          fees: new BigNumber(50000),
        }),
      );

      expect({
        errors: status.errors,
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ errors: {}, totalSpent: "10" });
    });

    it("reports NotEnoughEGLDForFees when the EGLD balance cannot pay the ESDT fees", async () => {
      const account = buildAccount({ balance: "10", withToken: true });
      const status = await getTransactionStatus(
        account,
        buildTransaction({
          subAccountId: buildTokenAccount().id,
          amount: new BigNumber(10),
          fees: new BigNumber(50000),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughEGLDForFees);
    });

    it("reports MultiversXDecimalsLimitReached when ESDT fees have more than 18 decimals", async () => {
      const account = buildAccount({ withToken: true });
      const status = await getTransactionStatus(
        account,
        buildTransaction({
          subAccountId: buildTokenAccount().id,
          amount: new BigNumber(10),
          fees: new BigNumber("0.0000000000000000001"),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(MultiversXDecimalsLimitReached);
    });

    it("reports a send max whose amount leaves the fees payable without error", async () => {
      const fees = new BigNumber(50000);
      const account = buildAccount();
      const amount = account.spendableBalance.minus(fees);
      const status = await getTransactionStatus(
        account,
        buildTransaction({ amount, fees, useAllAmount: true }),
      );

      expect({
        errors: status.errors,
        warnings: status.warnings,
        amount: status.amount.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({
        errors: {},
        warnings: {},
        amount: amount.toString(),
        totalSpent: account.spendableBalance.toString(),
      });
    });
  });

  describe("staking", () => {
    it("reports MultiversXMinDelegatedAmountError below 1 EGLD for a delegate", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          mode: "delegate",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber(1000),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(MultiversXMinDelegatedAmountError);
    });

    it("reports MultiversXMinUndelegatedAmountError below 1 EGLD for an unDelegate", async () => {
      const status = await getTransactionStatus(
        buildAccount({ delegations: [buildDelegation("3000000000000000000")] }),
        buildTransaction({
          mode: "unDelegate",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber(1000),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(MultiversXMinUndelegatedAmountError);
    });

    it("reports MultiversXDelegationBelowMinimumError when the remaining delegation is below 1 EGLD", async () => {
      const status = await getTransactionStatus(
        buildAccount({ delegations: [buildDelegation("2500000000000000000")] }),
        buildTransaction({
          mode: "unDelegate",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber("1800000000000000000"),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(MultiversXDelegationBelowMinimumError);
    });

    it("accepts an unDelegate of the whole delegation", async () => {
      const status = await getTransactionStatus(
        buildAccount({ delegations: [buildDelegation("2500000000000000000")] }),
        buildTransaction({
          mode: "unDelegate",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber("2500000000000000000"),
        }),
      );

      expect(status.errors).toEqual({});
    });

    it("reports NotEnoughEGLDForFees when a claimRewards cannot pay its fees", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "10" }),
        buildTransaction({
          mode: "claimRewards",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber(0),
          fees: new BigNumber(50000),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughEGLDForFees);
    });

    it("reports only the fees as total spent for a claimRewards", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          mode: "claimRewards",
          recipient: DELEGATION_CONTRACT,
          amount: new BigNumber(0),
          fees: new BigNumber(50000),
        }),
      );

      expect(status.totalSpent.toString()).toBe("50000");
    });
  });
});
