import { getTransactionStatus } from "./getTransactionStatus";
import { BigNumber } from "bignumber.js";
import type { MultiversXAccount, Transaction } from "./types";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeTooHigh,
  AmountRequired,
} from "@ledgerhq/errors";
import {
  MultiversXDecimalsLimitReached,
  MultiversXMinDelegatedAmountError,
  MultiversXMinUndelegatedAmountError,
  MultiversXDelegationBelowMinimumError,
  NotEnoughEGLDForFees,
} from "./errors";

jest.mock("./logic", () => ({
  isValidAddress: jest.fn(),
  isSelfTransaction: jest.fn(),
  isAmountSpentFromBalance: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn(() => "1 EGLD"),
}));

jest.mock("@ledgerhq/coin-framework/account", () => ({
  getAccountCurrency: jest.fn(() => ({
    units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
  })),
}));

const { isValidAddress, isSelfTransaction, isAmountSpentFromBalance } = jest.requireMock("./logic");

describe("getTransactionStatus", () => {
  const createAccount = (overrides = {}): MultiversXAccount =>
    ({
      id: "account1",
      freshAddress: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      spendableBalance: new BigNumber("10000000000000000000"),
      currency: {
        name: "MultiversX",
        units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
      },
      multiversxResources: {
        nonce: 1,
        delegations: [],
        isGuarded: false,
      },
      subAccounts: [],
      ...overrides,
    }) as unknown as MultiversXAccount;

  const createTransaction = (overrides = {}): Transaction => ({
    family: "multiversx",
    mode: "send",
    amount: new BigNumber("1000000000000000000"),
    recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    useAllAmount: false,
    fees: new BigNumber("50000000000000"),
    gasLimit: 50000,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    isValidAddress.mockReturnValue(true);
    isSelfTransaction.mockReturnValue(false);
    isAmountSpentFromBalance.mockReturnValue(true);
  });

  describe("recipient validation", () => {
    it("returns RecipientRequired when recipient is empty", async () => {
      const account = createAccount();
      const transaction = createTransaction({ recipient: "" });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("returns InvalidAddressBecauseDestinationIsAlsoSource for self transaction", async () => {
      isSelfTransaction.mockReturnValue(true);
      const account = createAccount();
      const transaction = createTransaction();

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("returns InvalidAddress for invalid recipient", async () => {
      isValidAddress.mockReturnValue(false);
      const account = createAccount();
      const transaction = createTransaction();

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });

  describe("fees validation", () => {
    it("returns FeeNotLoaded when fees are null", async () => {
      const account = createAccount();
      const transaction = createTransaction({ fees: null });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });
  });

  describe("amount validation", () => {
    it("returns AmountRequired when amount is zero and not useAllAmount", async () => {
      const account = createAccount();
      const transaction = createTransaction({ amount: new BigNumber(0), useAllAmount: false });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("does not return AmountRequired for zero amount with useAllAmount", async () => {
      const account = createAccount();
      const transaction = createTransaction({ amount: new BigNumber(0), useAllAmount: true });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).not.toBeInstanceOf(AmountRequired);
    });

    it("does not return AmountRequired for delegation modes with zero amount", async () => {
      const account = createAccount();
      const transaction = createTransaction({ amount: new BigNumber(0), mode: "claimRewards" });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).not.toBeInstanceOf(AmountRequired);
    });
  });

  describe("balance validation", () => {
    it("returns NotEnoughBalance when total spent exceeds spendable balance", async () => {
      const account = createAccount({ spendableBalance: new BigNumber("100000000000000") });
      const transaction = createTransaction({ amount: new BigNumber("10000000000000000000") });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("delegation validation", () => {
    it("returns MultiversXMinDelegatedAmountError for delegate with amount below minimum", async () => {
      const account = createAccount();
      const transaction = createTransaction({
        mode: "delegate",
        amount: new BigNumber("500000000000000000"), // 0.5 EGLD, below 1 EGLD minimum
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(MultiversXMinDelegatedAmountError);
    });

    it("returns MultiversXMinUndelegatedAmountError for unDelegate with amount below minimum", async () => {
      const account = createAccount();
      const transaction = createTransaction({
        mode: "unDelegate",
        amount: new BigNumber("500000000000000000"), // 0.5 EGLD
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(MultiversXMinUndelegatedAmountError);
    });

    it("returns MultiversXDelegationBelowMinimumError when remaining delegation is below minimum", async () => {
      const account = createAccount({
        multiversxResources: {
          nonce: 1,
          delegations: [
            {
              contract: "erd1validator",
              userActiveStake: "1500000000000000000", // 1.5 EGLD
            },
          ],
          isGuarded: false,
        },
      });
      const transaction = createTransaction({
        mode: "unDelegate",
        recipient: "erd1validator",
        amount: new BigNumber("1000000000000000000"), // 1 EGLD, leaving 0.5 EGLD
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(MultiversXDelegationBelowMinimumError);
    });
  });

  describe("token account validation", () => {
    it("returns NotEnoughBalance when token amount exceeds token balance", async () => {
      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("100000000"),
      };
      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const transaction = createTransaction({
        subAccountId: "token1",
        amount: new BigNumber("200000000"), // More than token balance
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("returns NotEnoughEGLDForFees when token transfer but not enough EGLD for fees", async () => {
      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("1000000000000"),
      };
      const account = createAccount({
        subAccounts: [tokenAccount],
        spendableBalance: new BigNumber("10000000"), // Very low EGLD
      });
      const transaction = createTransaction({
        subAccountId: "token1",
        amount: new BigNumber("100000000"),
        fees: new BigNumber("50000000000000000"), // High fees
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.errors.amount).toBeInstanceOf(NotEnoughEGLDForFees);
    });
  });

  describe("warnings", () => {
    it("returns FeeTooHigh warning when fees are more than 10% of amount", async () => {
      const account = createAccount();
      const transaction = createTransaction({
        mode: "send",
        amount: new BigNumber("100000000000000"), // 0.0001 EGLD
        fees: new BigNumber("50000000000000"), // 0.00005 EGLD - more than 10%
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });
  });

  describe("return values", () => {
    it("returns correct estimatedFees", async () => {
      const account = createAccount();
      const fees = new BigNumber("75000000000000");
      const transaction = createTransaction({ fees });

      const status = await getTransactionStatus(account, transaction);

      expect(status.estimatedFees).toEqual(fees);
    });

    it("returns zero estimatedFees when fees is null", async () => {
      const account = createAccount();
      const transaction = createTransaction({ fees: null });

      const status = await getTransactionStatus(account, transaction);

      expect(status.estimatedFees).toEqual(new BigNumber(0));
    });

    it("returns correct amount", async () => {
      const account = createAccount();
      const amount = new BigNumber("2000000000000000000");
      const transaction = createTransaction({ amount });

      const status = await getTransactionStatus(account, transaction);

      expect(status.amount).toEqual(amount);
    });

    it("returns correct totalSpent for token transfer", async () => {
      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("10000000000000"),
      };
      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const amount = new BigNumber("5000000000000");
      const transaction = createTransaction({
        subAccountId: "token1",
        amount,
      });

      const status = await getTransactionStatus(account, transaction);

      expect(status.totalSpent).toEqual(amount);
    });
  });
});
