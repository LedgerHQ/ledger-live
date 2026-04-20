import BigNumber from "bignumber.js";
import aleoConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { estimateFees } from "../logic";
import {
  calculateAmount,
  findBestRecordForFee,
  selectPrivateRecordsForAmount,
} from "../logic/utils";
import {
  getMockedAccount,
  mockUnspentRecord1,
  mockUnspentRecord2,
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
  selectPrivateRecordsForAmount: jest.fn(),
}));

const mockConfig = getMockedConfig("mainnet");
const mockAleoConfig = jest.mocked(aleoConfig);
const mockEstimateFees = jest.mocked(estimateFees);
const mockCalculateAmount = jest.mocked(calculateAmount);
const mockFindBestRecordForFee = jest.mocked(findBestRecordForFee);
const mockSelectPrivateRecordsForAmount = jest.mocked(selectPrivateRecordsForAmount);

describe("prepareTransaction", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
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
    mockSelectPrivateRecordsForAmount.mockReturnValue([mockUnspentRecord1]);
  });

  it("should return transaction with calculated amount and fees", async () => {
    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
    });
  });

  it("should call calculateAmount", async () => {
    await prepareTransaction(mockAccount, mockTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockTransaction,
      account: mockAccount,
      estimatedFees: mockFees,
    });
  });

  it("should auto-select amount records and update feeRecordCommitment for private non-sponsored transactions", async () => {
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
      selectedAmountRecordCommitments: [mockUnspentRecord1.commitment],
      targetFee: mockFees,
    });
    expect(mockSelectPrivateRecordsForAmount).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
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
        amountRecordCommitments: [mockUnspentRecord1.commitment],
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
        amountRecordCommitments: [mockUnspentRecord1.commitment],
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
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    });
  });

  it("should use selectPrivateRecordsForAmount for private send max", async () => {
    const mockPrivateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      useAllAmount: true,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    };

    mockSelectPrivateRecordsForAmount.mockReturnValue([mockUnspentRecord1, mockUnspentRecord2]);

    await prepareTransaction(mockAccount, mockPrivateTransaction);

    expect(mockSelectPrivateRecordsForAmount).toHaveBeenCalledTimes(1);
    expect(mockSelectPrivateRecordsForAmount).toHaveBeenCalledWith({
      unspentRecords: mockAccount.aleoResources?.unspentPrivateRecords ?? [],
      targetAmount: null,
    });
  });
});
