import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { setCoinConfig } from "./config";
import {
  AlgorandASANotOptInInRecipient,
  AlgorandMemoExceededSizeError,
  ClaimRewardsFeesWarning,
} from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import { getAccount } from "./network";
import { mockAlgorandConfig } from "./test/context";
import {
  ASSET_ID,
  buildAccount,
  buildNetworkAccount,
  buildTokenAccount,
  buildTransaction,
  EMPTY_SENDER,
  FUNDED_RECIPIENT,
  NOT_OPTED_IN_RECIPIENT,
  SENDER,
  UNFUNDED_RECIPIENT,
} from "./test/fixtures";

jest.mock("./network", () => ({ getAccount: jest.fn() }));

const mockGetAccount = getAccount as jest.Mock;

const NETWORK_ACCOUNTS = {
  [FUNDED_RECIPIENT]: buildNetworkAccount(FUNDED_RECIPIENT, { assets: [ASSET_ID] }),
  [UNFUNDED_RECIPIENT]: buildNetworkAccount(UNFUNDED_RECIPIENT, { balance: "0" }),
  [NOT_OPTED_IN_RECIPIENT]: buildNetworkAccount(NOT_OPTED_IN_RECIPIENT),
};

describe("getTransactionStatus (legacy bridge)", () => {
  beforeEach(() => {
    setCoinConfig(() => mockAlgorandConfig);
    mockGetAccount.mockReset();
    mockGetAccount.mockImplementation(async (_config: unknown, address: string) => {
      const account = NETWORK_ACCOUNTS[address];
      if (!account) throw new Error(`unexpected network account ${address}`);
      return account;
    });
  });

  describe("recipient", () => {
    it("requires a recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects an invalid address", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "invalidADDRESS" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("rejects a recipient equal to the sender", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: SENDER, amount: new BigNumber(100) }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("reports AlgorandASANotOptInInRecipient when the recipient did not opt in the asset", async () => {
      const account = buildAccount();
      const status = await getTransactionStatus(
        account,
        buildTransaction({
          subAccountId: buildTokenAccount(SENDER, "5000000").id,
          amount: new BigNumber(1000),
          recipient: NOT_OPTED_IN_RECIPIENT,
        }),
      );

      expect(status.errors.recipient).toBeInstanceOf(AlgorandASANotOptInInRecipient);
    });
  });

  describe("algo send", () => {
    it("reports no error for a send to a funded recipient", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction());

      expect({ errors: status.errors, warnings: status.warnings }).toEqual({
        errors: {},
        warnings: {},
      });
    });

    it("reports the amount, fees and total spent", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction());

      expect({
        amount: status.amount.toString(),
        estimatedFees: status.estimatedFees.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ amount: "100000", estimatedFees: "1000", totalSpent: "101000" });
    });

    it("requires an amount", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("requires the fees to be loaded", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ fees: null as unknown as BigNumber }),
      );

      expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });

    it("warns when the fees are more than a tenth of the amount", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(1000) }),
      );

      expect(status.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });

    it("reports NotEnoughBalanceBecauseDestinationNotCreated below the minimum for an unfunded recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(100), recipient: UNFUNDED_RECIPIENT }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
    });

    it("accepts the minimum amount for an unfunded recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(100000), recipient: UNFUNDED_RECIPIENT }),
      );

      expect(status.errors.amount).toBeUndefined();
    });

    it("reports NotEnoughBalance when sending the whole balance", async () => {
      const account = buildAccount();
      const status = await getTransactionStatus(
        account,
        buildTransaction({ amount: account.balance }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports NotEnoughBalance when sending the balance minus a dust amount", async () => {
      const account = buildAccount();
      const status = await getTransactionStatus(
        account,
        buildTransaction({ amount: account.balance.minus(100) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports NotEnoughBalance for an account that holds nothing", async () => {
      const status = await getTransactionStatus(
        buildAccount({ address: EMPTY_SENDER, balance: "0", nbAssets: 0, tokenBalance: null }),
        buildTransaction({ amount: new BigNumber(1000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports a send max leaving the base reserve and the fees", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect({
        errors: status.errors,
        warnings: status.warnings,
        amount: status.amount.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ errors: {}, warnings: {}, amount: "966089", totalSpent: "967089" });
    });

    it("reports NotEnoughBalance for a send max when nothing is spendable", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "100000", nbAssets: 0, tokenBalance: null }),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("token send", () => {
    const tokenSubAccountId = buildTokenAccount(SENDER, "5000000").id;

    it("reports the token amount without adding the fees", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ subAccountId: tokenSubAccountId, amount: new BigNumber(1000) }),
      );

      expect({
        errors: status.errors,
        amount: status.amount.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ errors: {}, amount: "1000", totalSpent: "1000" });
    });

    it("reports NotEnoughBalance when the amount exceeds the token balance", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          subAccountId: tokenSubAccountId,
          amount: new BigNumber("100000000000"),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports a token send max equal to the token balance", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          subAccountId: tokenSubAccountId,
          amount: new BigNumber(0),
          useAllAmount: true,
        }),
      );

      expect({ errors: status.errors, amount: status.amount.toString() }).toEqual({
        errors: {},
        amount: "5000000",
      });
    });

    it("reports NotEnoughBalanceInParentAccount when the algo balance cannot pay the fees", async () => {
      const status = await getTransactionStatus(
        buildAccount({ address: EMPTY_SENDER, balance: "0", nbAssets: 1, tokenBalance: "2000000" }),
        buildTransaction({
          subAccountId: buildTokenAccount(EMPTY_SENDER, "2000000").id,
          amount: new BigNumber(1000000),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalanceInParentAccount);
    });
  });

  describe("optIn", () => {
    it("reports no error and no spent amount for an opt-in", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          mode: "optIn",
          assetId: "algorand/asa/31231",
          amount: new BigNumber(0),
        }),
      );

      expect({
        errors: status.errors,
        amount: status.amount.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ errors: {}, amount: "0", totalSpent: "1000" });
    });

    it("requires an asset id", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ mode: "optIn", assetId: null, amount: new BigNumber(0) }),
      );

      expect(status.errors.assetId).toEqual(new Error("Asset Id is not set"));
    });

    it("requires the fees to be loaded", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({
          mode: "optIn",
          assetId: "algorand/asa/31231",
          amount: new BigNumber(0),
          fees: null as unknown as BigNumber,
        }),
      );

      expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });

    it("reports NotEnoughBalance when the spendable balance cannot pay the fees", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "200000", nbAssets: 0, tokenBalance: null }),
        buildTransaction({
          mode: "optIn",
          assetId: "algorand/asa/31231",
          amount: new BigNumber(0),
        }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("claimReward", () => {
    it("reports no error when the fees can be paid", async () => {
      const status = await getTransactionStatus(
        buildAccount({ rewards: "5000" }),
        buildTransaction({ mode: "claimReward", amount: new BigNumber(0) }),
      );

      expect({ errors: status.errors, warnings: status.warnings }).toEqual({
        errors: {},
        warnings: {},
      });
    });

    it("warns when the fees exceed the pending rewards", async () => {
      const status = await getTransactionStatus(
        buildAccount({ rewards: "10" }),
        buildTransaction({ mode: "claimReward", amount: new BigNumber(0) }),
      );

      expect(status.warnings.claimReward).toBeInstanceOf(ClaimRewardsFeesWarning);
    });

    it("reports NotEnoughBalance when the spendable balance cannot pay the fees", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "100000", nbAssets: 0, tokenBalance: null }),
        buildTransaction({ mode: "claimReward", amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("memo", () => {
    it("reports AlgorandMemoExceededSizeError for a memo over the size limit", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ memo: "a".repeat(2000) }),
      );

      expect(status.errors.transaction).toBeInstanceOf(AlgorandMemoExceededSizeError);
    });
  });
});
