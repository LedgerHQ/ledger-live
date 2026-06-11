import BigNumber from "bignumber.js";
import aleoConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { estimateFees } from "../logic";
import { calculateAmount, findBestRecordForFee } from "../logic/utils";
import {
  getMockedAccount,
  getMockedTokenAccount,
  mockUnspentRecord1,
  mockUnspentRecord2,
  mockUnspentTokenRecord1,
  mockUnspentTokenRecord2,
} from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import type { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic");
jest.mock("../config");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  calculateAmount: jest.fn(),
  findBestRecordForFee: jest.fn(),
}));

const mockConfig = getMockedConfig("mainnet");
const mockAleoConfig = jest.mocked(aleoConfig);
const mockEstimateFees = jest.mocked(estimateFees);
const mockCalculateAmount = jest.mocked(calculateAmount);
const mockFindBestRecordForFee = jest.mocked(findBestRecordForFee);

describe("prepareTransaction", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockTokenAccount = {
    ...getMockedTokenAccount(),
    unspentPrivateRecords: [mockUnspentTokenRecord1, mockUnspentTokenRecord2],
  };
  const accountWithTokenSubAccount = getMockedAccount({
    subAccounts: [mockTokenAccount],
    aleoResources: {
      transparentBalance: new BigNumber(1000),
      provableApi: null,
      privateBalance: new BigNumber(1),
      unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      lastPrivateSyncDate: new Date(),
    },
  });
  const mockFees = new BigNumber(5000);
  const mockAmount = new BigNumber(500000);
  const mockTransaction: Transaction = {
    family: "aleo",
    amount: new BigNumber(500000),
    useAllAmount: false,
    recipient: "aleo1recipient",
    fees: new BigNumber(0),
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAleoConfig.getCoinConfig.mockReturnValue(mockConfig);
    mockEstimateFees.mockReturnValue({ value: BigInt(mockFees.toString()) });
    mockCalculateAmount.mockReturnValue({
      amount: mockAmount,
      totalSpent: mockAmount.plus(mockFees),
    });
    mockFindBestRecordForFee.mockReturnValue(null);
  });

  it("should prepare public transaction with calculated amount and fees", async () => {
    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockTransaction,
      account: mockAccount,
      estimatedFees: mockFees,
    });
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      recipient: "aleo1recipient",
    });
  });

  it("should set recipient to freshAddress for native public shield", async () => {
    const result = await prepareTransaction(mockAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
      recipient: "aleo1other",
    });

    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
      recipient: mockAccount.freshAddress,
    });
  });

  it("should set recipient to freshAddress for native private unshield", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      isFeeSponsored: true,
    });

    const result = await prepareTransaction(mockAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
      recipient: "aleo1other",
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    });

    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
      recipient: mockAccount.freshAddress,
    });
  });

  it("should normalize transaction mode after switching from sub-account to main account", async () => {
    const result = await prepareTransaction(mockAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
    });

    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockEstimateFees).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
  });

  it("should update feeRecordCommitment for private transactions with non-sponsored fees", async () => {
    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    };
    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      isFeeSponsored: false,
    });
    mockFindBestRecordForFee.mockReturnValue(mockUnspentRecord2);

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockFindBestRecordForFee).toHaveBeenCalledTimes(1);
    expect(mockFindBestRecordForFee).toHaveBeenCalledWith({
      unspentRecords: accountWithPrivateRecords.aleoResources?.unspentPrivateRecords ?? [],
      selectedAmountRecordCommitments: mockPrivateTransaction.properties.amountRecordCommitments,
      targetFee: mockFees,
    });
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      properties: {
        amountRecordCommitments: mockPrivateTransaction.properties.amountRecordCommitments,
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });
  });

  it("should keep existing feeRecordCommitment when fee record selection returns null", async () => {
    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      isFeeSponsored: false,
    });
    mockFindBestRecordForFee.mockReturnValue(null);

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockFindBestRecordForFee).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      properties: {
        amountRecordCommitments: mockPrivateTransaction.properties.amountRecordCommitments,
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });
  });

  it("should keep feeRecordCommitment as null when neither fee record selection nor existing commitment is available", async () => {
    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      isFeeSponsored: false,
    });
    mockFindBestRecordForFee.mockReturnValue(null);

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockFindBestRecordForFee).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      properties: {
        amountRecordCommitments: mockPrivateTransaction.properties.amountRecordCommitments,
        feeRecordCommitment: null,
      },
    });
  });

  it("should skip fee record selection for private transactions with sponsored fees", async () => {
    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    };

    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      isFeeSponsored: true,
    });

    const result = await prepareTransaction(mockAccount, mockPrivateTransaction);

    expect(mockFindBestRecordForFee).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      properties: {
        amountRecordCommitments: mockPrivateTransaction.properties.amountRecordCommitments,
        feeRecordCommitment: null,
      },
    });
  });

  it("should keep selected amount record when recordPickingStrategy is manual", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "manual",
      isFeeSponsored: true,
    });

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockPrivateTransaction,
      account: accountWithPrivateRecords,
      estimatedFees: mockFees,
    });
    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
      },
    });
  });

  it("should auto-select the smallest sufficient amount record when recordPickingStrategy is auto", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: true,
    });

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      amount: new BigNumber(550000),
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: expect.objectContaining({
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: expect.objectContaining({
          amountRecordCommitments: [mockUnspentRecord2.commitment],
        }),
      }),
      account: accountWithPrivateRecords,
      estimatedFees: mockFees,
    });
    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [mockUnspentRecord2.commitment],
      },
    });
  });

  it("should accumulate multiple records when no single record can cover the amount", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: true,
    });

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      amount: new BigNumber(900000),
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
      },
    });
  });

  it("should return empty amount records when available funds cannot cover the amount", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: true,
    });

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      amount: new BigNumber(1500000),
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [],
      },
    });
  });

  it("should auto-select amount and fee records when recordPickingStrategy is auto and fees are not sponsored", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: false,
    });
    mockFindBestRecordForFee.mockReturnValue(mockUnspentRecord1);

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      amount: new BigNumber(550000),
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(mockFindBestRecordForFee).toHaveBeenCalledTimes(1);
    expect(mockFindBestRecordForFee).toHaveBeenCalledWith({
      unspentRecords: accountWithPrivateRecords.aleoResources?.unspentPrivateRecords ?? [],
      selectedAmountRecordCommitments: [mockUnspentRecord2.commitment],
      targetFee: mockFees,
    });
    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [mockUnspentRecord2.commitment],
        feeRecordCommitment: mockUnspentRecord1.commitment,
      },
    });
  });

  it("should auto-select top records for useAllAmount with auto record picking strategy", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: true,
    });

    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      useAllAmount: true,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    const accountWithPrivateRecords = getMockedAccount({
      aleoResources: {
        transparentBalance: mockAccount.aleoResources?.transparentBalance ?? new BigNumber(0),
        provableApi: mockAccount.aleoResources?.provableApi ?? null,
        privateBalance: mockAccount.aleoResources?.privateBalance ?? null,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        lastPrivateSyncDate: mockAccount.aleoResources?.lastPrivateSyncDate ?? null,
      },
    });

    const result = await prepareTransaction(accountWithPrivateRecords, mockPrivateTransaction);

    expect(result).toMatchObject({
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
      },
    });
  });

  it("should set transfer_token_public mode and keep recipient for token public send", async () => {
    const result = await prepareTransaction(accountWithTokenSubAccount, {
      ...mockTransaction,
      subAccountId: mockTokenAccount.id,
    });

    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(mockEstimateFees).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      transactionType: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
    });
    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
      recipient: "aleo1recipient",
    });
  });

  it("should set recipient to freshAddress for token public shield", async () => {
    const result = await prepareTransaction(accountWithTokenSubAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
      subAccountId: mockTokenAccount.id,
      recipient: "aleo1other",
    });

    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
      recipient: accountWithTokenSubAccount.freshAddress,
    });
  });

  it("should set recipient to freshAddress for token private unshield", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "manual",
      isFeeSponsored: true,
    });

    const result = await prepareTransaction(accountWithTokenSubAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
      subAccountId: mockTokenAccount.id,
      recipient: "aleo1other",
      properties: {
        amountRecordCommitments: [mockUnspentTokenRecord1.commitment],
        feeRecordCommitment: null,
      },
    });

    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
      recipient: accountWithTokenSubAccount.freshAddress,
    });
  });

  it("should pick token amount records from subAccount and native ALEO fee record for private token transfer", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "auto",
      isFeeSponsored: false,
    });
    mockFindBestRecordForFee.mockReturnValue(mockUnspentRecord1);

    const result = await prepareTransaction(accountWithTokenSubAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      subAccountId: mockTokenAccount.id,
      amount: new BigNumber(550000),
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    });

    expect(mockFindBestRecordForFee).toHaveBeenCalledTimes(1);
    expect(mockFindBestRecordForFee).toHaveBeenCalledWith({
      unspentRecords: accountWithTokenSubAccount.aleoResources?.unspentPrivateRecords ?? [],
      selectedAmountRecordCommitments: [],
      targetFee: mockFees,
    });
    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentTokenRecord2.commitment],
        feeRecordCommitment: mockUnspentRecord1.commitment,
      },
    });
  });

  it("should keep manual token amount records on re-prepare when mode is already transfer_token_private", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...mockConfig,
      recordPickingStrategy: "manual",
      isFeeSponsored: true,
    });

    const result = await prepareTransaction(accountWithTokenSubAccount, {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      subAccountId: mockTokenAccount.id,
      properties: {
        amountRecordCommitments: [mockUnspentTokenRecord1.commitment],
        feeRecordCommitment: null,
      },
    });

    expect(result).toMatchObject({
      mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentTokenRecord1.commitment],
      },
    });
  });
});
