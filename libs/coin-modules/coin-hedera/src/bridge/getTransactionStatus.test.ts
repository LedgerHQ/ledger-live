import BigNumber from "bignumber.js";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  HederaInsufficientFundsForAssociation,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
} from "@ledgerhq/errors";
import { MEMO_CHARACTER_LIMIT } from "../constants";
import { HederaMemoIsTooLong } from "../errors";
import { getTransactionStatus } from "./getTransactionStatus";
import * as estimateFees from "../logic/estimateFees";
import * as logicUtils from "../logic/utils";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";

describe("getTransactionStatus", () => {
  const mockedEstimatedFee = new BigNumber(1);
  const mockedUsdRate = new BigNumber(1);
  const validRecipientAddress = "0.0.1234567";
  const invalidRecipientAddress = "invalid_address";

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(logicUtils, "getCurrencyToUSDRate").mockResolvedValueOnce(mockedUsdRate);
    jest.spyOn(estimateFees, "estimateFees").mockResolvedValueOnce(mockedEstimatedFee);
  });

  test("coin transfer with valid recipient and sufficient balance completes successfully", async () => {
    const mockedAccount = getMockedAccount({ balance: new BigNumber(1000) });
    const mockedTransaction = getMockedTransaction({
      recipient: validRecipientAddress,
      amount: new BigNumber(100),
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toEqual(new BigNumber(100));
    expect(result.totalSpent.isGreaterThan(100)).toBe(true);
  });

  test("token transfer with valid recipient and sufficient balance completes successfully", async () => {
    jest.spyOn(logicUtils, "checkAccountTokenAssociationStatus").mockResolvedValueOnce(true);

    const tokenCurrency = getMockedTokenCurrency();
    const tokenAccount = getMockedTokenAccount(tokenCurrency, { balance: new BigNumber(500) });
    const account = getMockedAccount({ balance: new BigNumber(1000), subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      recipient: validRecipientAddress,
      amount: new BigNumber(200),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toEqual(new BigNumber(200));
  });

  test("token associate transaction with sufficient USD worth completes successfully", async () => {
    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      mode: "token-associate",
      properties: {
        token: mockedTokenCurrency,
      },
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.amount).toEqual(new BigNumber(0));
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.totalSpent).toEqual(mockedEstimatedFee);
    expect(result.estimatedFees).toEqual(mockedEstimatedFee);
  });

  test("adds error for invalid recipient address", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({ recipient: invalidRecipientAddress });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  test("adds error for too long memo", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({ memo: "a".repeat(MEMO_CHARACTER_LIMIT + 1) });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.memo).toBeInstanceOf(HederaMemoIsTooLong);
  });

  test("adds error for self transfers", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      recipient: mockedAccount.freshAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  test("adds error during coin transfer with insufficient balance", async () => {
    const mockedAccount = getMockedAccount({ balance: new BigNumber(0) });
    const mockedTransaction = getMockedTransaction({
      amount: new BigNumber(100),
      recipient: validRecipientAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  test("adds error if USD balance is too low for token association", async () => {
    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedAccount = getMockedAccount({ balance: new BigNumber(0) });
    const mockedTransaction = getMockedTransaction({
      mode: "token-associate",
      properties: {
        token: mockedTokenCurrency,
      },
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.insufficientAssociateBalance).toBeInstanceOf(
      HederaInsufficientFundsForAssociation,
    );
  });

  test("adds warning during token transfer if recipient has no token associated", async () => {
    jest.spyOn(logicUtils, "checkAccountTokenAssociationStatus").mockResolvedValueOnce(false);

    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: mockedTokenAccount.id,
      recipient: validRecipientAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.warnings.missingAssociation).toBeInstanceOf(
      HederaRecipientTokenAssociationRequired,
    );
  });

  test("adds warning if token association status can't be verified", async () => {
    jest
      .spyOn(logicUtils, "checkAccountTokenAssociationStatus")
      .mockRejectedValueOnce(new HederaRecipientTokenAssociationUnverified());

    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: mockedTokenAccount.id,
      recipient: validRecipientAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.warnings.unverifiedAssociation).toBeInstanceOf(
      HederaRecipientTokenAssociationUnverified,
    );
  });

  test("adds error during token transfer with insufficient balance", async () => {
    const mockedTokenCurrency = getMockedTokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency, {
      balance: new BigNumber(0),
    });
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: mockedTokenAccount.id,
      recipient: validRecipientAddress,
      amount: new BigNumber(100),
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  test("adds error if amount is zero and useAllAmount is false", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      recipient: validRecipientAddress,
      amount: new BigNumber(0),
      useAllAmount: false,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });
});
