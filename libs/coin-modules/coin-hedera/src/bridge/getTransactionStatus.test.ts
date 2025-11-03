import BigNumber from "bignumber.js";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
  ClaimRewardsFeesWarning,
  RecipientRequired,
} from "@ledgerhq/errors";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import {
  HederaInsufficientFundsForAssociation,
  HederaInvalidStakingNodeIdError,
  HederaNoStakingRewardsError,
  HederaRecipientEvmAddressVerificationRequired,
  HederaRecipientInvalidChecksum,
  HederaRecipientTokenAssociationRequired,
  HederaRecipientTokenAssociationUnverified,
  HederaRedundantStakingNodeIdError,
} from "../errors";
import { getTransactionStatus } from "./getTransactionStatus";
import * as estimateFees from "../logic/estimateFees";
import * as logicUtils from "../logic/utils";
import * as preloadData from "../preload-data";
import { rpcClient } from "../network/rpc";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import type { EstimateFeesResult, HederaPreloadData } from "../types";

describe("getTransactionStatus", () => {
  const mockedEstimatedFee: EstimateFeesResult = { tinybars: new BigNumber(1) };
  const mockedUsdRate = new BigNumber(1);
  const mockPreload = { validators: [{ nodeId: 1 }, { nodeId: 2 }] } as HederaPreloadData;
  const validRecipientAddress = "0.0.1234567";
  const validRecipientAddressWithChecksum = "0.0.1234567-ylkls";

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(estimateFees, "estimateFees").mockResolvedValueOnce(mockedEstimatedFee);
    jest.spyOn(logicUtils, "getCurrencyToUSDRate").mockResolvedValueOnce(mockedUsdRate);
    jest.spyOn(preloadData, "getCurrentHederaPreloadData").mockReturnValueOnce(mockPreload);
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
    jest.spyOn(logicUtils, "checkAccountTokenAssociationStatus").mockResolvedValueOnce(true);

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
    jest.spyOn(logicUtils, "checkAccountTokenAssociationStatus").mockResolvedValueOnce(false);

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
