import BigNumber from "bignumber.js";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  ClaimRewardsFeesWarning,
  RecipientRequired,
} from "@ledgerhq/errors";
import * as accountHelpers from "@ledgerhq/coin-framework/account";
import { HEDERA_TRANSACTION_MODES, MEMO_CHARACTER_LIMIT } from "../constants";
import {
  HederaInsufficientFundsForAssociation,
  HederaInvalidStakingNodeIdError,
  HederaNoStakingRewardsError,
  HederaRecipientEvmAddressVerificationRequired,
  HederaRecipientInvalidChecksum,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
  HederaRedundantStakingNodeIdError,
  HederaMemoIsTooLong,
} from "../errors";
import { rpcClient } from "../network/rpc";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import type { EstimateFeesResult, HederaPreloadData, Transaction } from "../types";

// Mock modules before importing
jest.mock("../logic/estimateFees", () => ({
  ...jest.requireActual("../logic/estimateFees"),
  estimateFees: jest.fn(),
}));

jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  getCurrencyToUSDRate: jest.fn(),
  checkAccountTokenAssociationStatus: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/account", () => {
  const actual = jest.requireActual("@ledgerhq/coin-framework/account");
  return {
    ...actual,
    findSubAccountById: jest.fn(actual.findSubAccountById),
  };
});

jest.mock("../preload-data", () => ({
  ...jest.requireActual("../preload-data"),
  getCurrentHederaPreloadData: jest.fn(),
}));

import * as estimateFees from "../logic/estimateFees";
import * as logicUtils from "../logic/utils";
import * as preloadData from "../preload-data";
import { getTransactionStatus } from "./getTransactionStatus";

const mockEstimateFees = estimateFees.estimateFees as jest.Mock;
const mockGetCurrencyToUSDRate = logicUtils.getCurrencyToUSDRate as jest.Mock;
const mockCheckAccountTokenAssociationStatus =
  logicUtils.checkAccountTokenAssociationStatus as jest.Mock;
const mockGetCurrentHederaPreloadData = preloadData.getCurrentHederaPreloadData as jest.Mock;
const mockFindSubAccountById = accountHelpers.findSubAccountById as jest.Mock;

describe("getTransactionStatus", () => {
  const mockedEstimatedFee: EstimateFeesResult = { tinybars: new BigNumber(1) };
  const mockedUsdRate = new BigNumber(1);
  const mockPreload = { validators: [{ nodeId: 1 }, { nodeId: 2 }] } as HederaPreloadData;
  const validRecipientAddress = "0.0.1234567";
  const validRecipientAddressWithChecksum = "0.0.1234567-ylkls";

  beforeEach(() => {
    jest.clearAllMocks();

    mockEstimateFees.mockResolvedValue(mockedEstimatedFee);
    mockGetCurrencyToUSDRate.mockResolvedValue(mockedUsdRate);
    mockGetCurrentHederaPreloadData.mockReturnValue(mockPreload);
    // Default: association is verified
    mockCheckAccountTokenAssociationStatus.mockResolvedValue(true);
    // Reset findSubAccountById to use actual implementation
    mockFindSubAccountById.mockImplementation(
      jest.requireActual("@ledgerhq/coin-framework/account").findSubAccountById,
    );
  });

  afterAll(() => {
    rpcClient._resetInstance();
  });

  it("coin transfer with valid recipient and sufficient balance completes successfully", async () => {
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

  it("hts token transfer with valid recipient and sufficient balance completes successfully", async () => {
    mockCheckAccountTokenAssociationStatus.mockResolvedValueOnce(true);

    const tokenCurrency = getMockedHTSTokenCurrency();
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

  it("erc20 token transfer with valid recipient and sufficient balance completes successfully", async () => {
    const tokenCurrency = getMockedERC20TokenCurrency();
    const tokenAccount = getMockedTokenAccount(tokenCurrency, { balance: new BigNumber(500) });
    const account = getMockedAccount({ balance: new BigNumber(1000), subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      recipient: validRecipientAddress,
      amount: new BigNumber(200),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toMatchObject({
      unverifiedEvmAddress: expect.any(Error),
    });
    expect(result.amount).toEqual(new BigNumber(200));
  });

  it("token associate transaction with sufficient USD worth completes successfully", async () => {
    const mockedTokenCurrency = getMockedHTSTokenCurrency();
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      properties: {
        token: mockedTokenCurrency,
      },
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.amount).toEqual(new BigNumber(0));
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.totalSpent).toEqual(mockedEstimatedFee.tinybars);
    expect(result.estimatedFees).toEqual(mockedEstimatedFee.tinybars);
  });

  it("recipient with checksum is supported", async () => {
    const mockedAccount = getMockedAccount({ balance: new BigNumber(1000) });
    const mockedTransaction = getMockedTransaction({
      recipient: validRecipientAddressWithChecksum,
      amount: new BigNumber(100),
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["short", "aaaaa"],
    ["exact limit", "a".repeat(MEMO_CHARACTER_LIMIT)],
  ])("allows %s memo", async (_description, memo) => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({ memo });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.memo).toBeUndefined();
  });

  it.each([
    {
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      description: "delegate",
    },
    {
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      description: "undelegate",
    },
    {
      mode: HEDERA_TRANSACTION_MODES.Redelegate,
      description: "redelegate",
    },
    {
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
      description: "claim rewards",
    },
    {
      mode: HEDERA_TRANSACTION_MODES.Send,
      description: "send native",
    },
    {
      mode: HEDERA_TRANSACTION_MODES.Send,
      description: "send hts token",
      subAccount: getMockedTokenAccount(getMockedHTSTokenCurrency(), { id: "hts-id" }),
    },
    {
      mode: HEDERA_TRANSACTION_MODES.Send,
      description: "send erc20 token",
      subAccount: getMockedTokenAccount(getMockedERC20TokenCurrency(), { id: "erc20-id" }),
    },
    {
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      description: "token associate",
      properties: { token: getMockedHTSTokenCurrency() },
    },
  ])("adds error for too long memo - $description", async ({ mode, subAccount, properties }) => {
    const tooLongMemo = "a".repeat(MEMO_CHARACTER_LIMIT + 1);
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      mode,
      memo: tooLongMemo,
      ...(subAccount && { subAccountId: subAccount.id }),
      ...(properties && { properties }),
    } as Transaction);

    mockFindSubAccountById.mockImplementation(() => {
      return subAccount;
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.memo).toBeInstanceOf(HederaMemoIsTooLong);
  });

  it("adds error for invalid recipient address", async () => {
    const mockedAccount = getMockedAccount();

    const txWithInvalidAddress1 = getMockedTransaction({ recipient: "" });
    const txWithInvalidAddress2 = getMockedTransaction({ recipient: "invalid_address" });
    const txWithInvalidAddressChecksum = getMockedTransaction({ recipient: "0.0.9124531-invld" });

    const [result1, result2, result3] = await Promise.all([
      getTransactionStatus(mockedAccount, txWithInvalidAddress1),
      getTransactionStatus(mockedAccount, txWithInvalidAddress2),
      getTransactionStatus(mockedAccount, txWithInvalidAddressChecksum),
    ]);

    expect(result1.errors.recipient).toBeInstanceOf(RecipientRequired);
    expect(result2.errors.recipient).toBeInstanceOf(InvalidAddress);
    expect(result3.errors.recipient).toBeInstanceOf(HederaRecipientInvalidChecksum);
  });

  it("adds error for self transfers", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      recipient: mockedAccount.freshAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("adds error during coin transfer with insufficient balance", async () => {
    const mockedAccount = getMockedAccount({ balance: new BigNumber(0) });
    const mockedTransaction = getMockedTransaction({
      amount: new BigNumber(100),
      recipient: validRecipientAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("adds error if USD balance is too low for token association", async () => {
    const mockedTokenCurrency = getMockedHTSTokenCurrency();
    const mockedAccount = getMockedAccount({ balance: new BigNumber(0) });
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      properties: {
        token: mockedTokenCurrency,
      },
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.insufficientAssociateBalance).toBeInstanceOf(
      HederaInsufficientFundsForAssociation,
    );
  });

  it("adds warning during token transfer if recipient has no token associated", async () => {
    mockCheckAccountTokenAssociationStatus.mockResolvedValueOnce(false);

    const mockedTokenCurrency = getMockedHTSTokenCurrency();
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

  it("adds evm address verification warning during ERC20 token transfer", async () => {
    const mockedTokenCurrency = getMockedERC20TokenCurrency();
    const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: mockedTokenAccount.id,
      recipient: validRecipientAddress,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.warnings.unverifiedEvmAddress).toBeInstanceOf(
      HederaRecipientEvmAddressVerificationRequired,
    );
  });

  it("adds warning if token association status can't be verified", async () => {
    jest
      .spyOn(logicUtils, "checkAccountTokenAssociationStatus")
      .mockRejectedValueOnce(new HederaRecipientTokenAssociationUnverified());

    const mockedTokenCurrency = getMockedHTSTokenCurrency();
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

  it("adds error during token transfer with insufficient balance", async () => {
    const mockedTokenCurrency = getMockedHTSTokenCurrency();
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

  it("adds error if amount is zero and useAllAmount is false", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      recipient: validRecipientAddress,
      amount: new BigNumber(0),
      useAllAmount: false,
    });

    const result = await getTransactionStatus(mockedAccount, mockedTransaction);

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("delegate transaction with valid node completes successfully", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 1 },
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toEqual(new BigNumber(0));
  });

  it("adds error for delegation without staking node id", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: {} as any,
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors.missingStakingNodeId).toBeInstanceOf(HederaInvalidStakingNodeIdError);
  });

  it("adds error for delegation with invalid staking node id", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 999 },
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors.stakingNodeId).toBeInstanceOf(HederaInvalidStakingNodeIdError);
  });

  it("adds error for delegation to already delegated node", async () => {
    const account = getMockedAccount({
      hederaResources: {
        maxAutomaticTokenAssociations: 0,
        isAutoTokenAssociationEnabled: false,
        delegation: {
          nodeId: 1,
          pendingReward: new BigNumber(0),
          delegated: new BigNumber(1000),
        },
      },
    });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 1 },
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors.stakingNodeId).toBeInstanceOf(HederaRedundantStakingNodeIdError);
  });

  it("adds error during staking transfer with insufficient balance", async () => {
    const mockedAccount = getMockedAccount({ balance: new BigNumber(0) });
    const mockedDelegateTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      properties: { stakingNodeId: 1 },
    });
    const mockedUndelegateTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      properties: { stakingNodeId: null },
    });
    const mockedRedelegateTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Redelegate,
      properties: { stakingNodeId: 2 },
    });
    const mockedClaimRewardsTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
    });

    const [resultDelegate, resultUndelegate, resultRedelegate, resultClaimRewards] =
      await Promise.all([
        getTransactionStatus(mockedAccount, mockedDelegateTransaction),
        getTransactionStatus(mockedAccount, mockedUndelegateTransaction),
        getTransactionStatus(mockedAccount, mockedRedelegateTransaction),
        getTransactionStatus(mockedAccount, mockedClaimRewardsTransaction),
      ]);

    expect(resultDelegate.errors.fee).toBeInstanceOf(NotEnoughBalance);
    expect(resultUndelegate.errors.fee).toBeInstanceOf(NotEnoughBalance);
    expect(resultRedelegate.errors.fee).toBeInstanceOf(NotEnoughBalance);
    expect(resultClaimRewards.errors.fee).toBeInstanceOf(NotEnoughBalance);
  });

  it("adds error when claiming rewards with no rewards available", async () => {
    const account = getMockedAccount({
      hederaResources: {
        maxAutomaticTokenAssociations: 0,
        isAutoTokenAssociationEnabled: false,
        delegation: {
          nodeId: 1,
          pendingReward: new BigNumber(0),
          delegated: new BigNumber(1000),
        },
      },
    });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors.noRewardsToClaim).toBeInstanceOf(HederaNoStakingRewardsError);
  });

  it("adds warning when claiming rewards with fee higher than rewards", async () => {
    const account = getMockedAccount({
      hederaResources: {
        maxAutomaticTokenAssociations: 0,
        isAutoTokenAssociationEnabled: false,
        delegation: {
          nodeId: 1,
          pendingReward: new BigNumber(10),
          delegated: new BigNumber(1000),
        },
      },
    });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
      maxFee: new BigNumber(100),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.warnings.claimRewardsFee).toBeInstanceOf(ClaimRewardsFeesWarning);
  });

  it("claim rewards with sufficient rewards completes successfully", async () => {
    const account = getMockedAccount({
      hederaResources: {
        maxAutomaticTokenAssociations: 0,
        isAutoTokenAssociationEnabled: false,
        delegation: {
          nodeId: 1,
          pendingReward: new BigNumber(100),
          delegated: new BigNumber(1000),
        },
      },
    });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
      maxFee: new BigNumber(10),
    });

    const result = await getTransactionStatus(account, transaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toEqual(new BigNumber(0));
  });
});
