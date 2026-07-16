import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  getMockedAccount,
  getMockedTokenAccount,
  mockAleoResources,
  mockUnspentRecord1,
  mockUnspentRecord2,
  mockUnspentTokenRecord1,
} from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import aleoCoinConfig from "../config";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
  TRANSACTION_TYPE,
} from "../constants";
import {
  AleoAmountRecordRequired,
  AleoAmountTooLargeForTransaction,
  AleoFeeRecordInsufficientBalance,
  AleoFeeRecordRequired,
  AleoTooManyRecordsSelected,
  AleoTwoRecordsRequired,
} from "../errors";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../config");
jest.mock("../logic");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  calculateAmount: jest.fn(),
}));

const mockEstimateFees = jest.mocked(estimateFees);
const mockValidateAddress = jest.mocked(validateAddress);
const mockCalculateAmount = jest.mocked(calculateAmount);
const mockAleoConfig = jest.mocked(aleoCoinConfig);

describe("getTransactionStatus", () => {
  const mockFees = new BigNumber(5000);
  const mockAmount = new BigNumber(500000);
  const mockConfig = getMockedConfig("testnet");
  const mockTransparentBalance = new BigNumber(1000000);
  const mockPrivateBalance = new BigNumber(5000);
  const mockBalance = mockTransparentBalance.plus(mockPrivateBalance);
  const mockAccount = getMockedAccount({
    balance: mockBalance,
    aleoResources: {
      ...mockAleoResources,
      transparentBalance: mockTransparentBalance,
      privateBalance: mockPrivateBalance,
    },
  });
  const mockTokenAccount = getMockedTokenAccount();
  const mockAccountWithTokenAccount = {
    ...mockAccount,
    id: mockAccount.id + "-token",
    subAccounts: [mockTokenAccount],
  };
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
    mockValidateAddress.mockResolvedValue(true);
    mockCalculateAmount.mockReturnValue({
      amount: mockAmount,
      totalSpent: mockAmount.plus(mockFees),
    });
  });

  it("should return empty errors and warnings for valid transaction", async () => {
    const result = await getTransactionStatus(mockAccount, mockTransaction);

    expect(result).toMatchObject({
      amount: mockAmount,
      totalSpent: mockAmount.plus(mockFees),
      estimatedFees: mockFees,
      errors: {},
      warnings: {},
    });
  });

  it("should call calculateAmount with correct parameters", async () => {
    await getTransactionStatus(mockAccount, mockTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockTransaction,
      account: mockAccount,
      estimatedFees: mockFees,
    });
  });

  it("should call estimateFees during status calculation", async () => {
    await getTransactionStatus(mockAccount, mockTransaction);

    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
  });

  describe("recipient validation", () => {
    it("adds error for empty recipient", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("adds error for invalid recipient address", async () => {
      mockValidateAddress.mockResolvedValue(false);

      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "invalid_address",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("validates the transaction recipient address", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "aleo1custom123",
      };

      await getTransactionStatus(mockAccount, transaction);

      expect(mockValidateAddress).toHaveBeenCalledTimes(1);
      expect(mockValidateAddress).toHaveBeenCalledWith("aleo1custom123", {});
    });

    it("adds error when recipient is same as sender address", async () => {
      const account = getMockedAccount({ freshAddress: "aleo1sender" });
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "aleo1sender",
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("allows same address as recipient when isSelfTransferTransaction returns true", async () => {
      const account = getMockedAccount({ freshAddress: "aleo1sender" });
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: account.freshAddress,
        mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        properties: {
          amountRecordCommitments: [],
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.recipient).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("adds error if amount is zero and useAllAmount is false", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: false,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("allows zero amount when useAllAmount is true", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: true,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });

    it("adds error when total spent exceeds balance", async () => {
      mockCalculateAmount.mockReturnValue({
        amount: mockAmount,
        totalSpent: new BigNumber(2000000),
      });

      const transaction: Transaction = {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds error during transfer with insufficient balance", async () => {
      const mockTransparentBalance = new BigNumber(1000);
      const mockPrivateBalance = new BigNumber(0);
      const mockBalance = mockTransparentBalance.plus(mockPrivateBalance);
      const poorAccount = getMockedAccount({
        balance: mockBalance,
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: mockTransparentBalance,
          privateBalance: mockPrivateBalance,
        },
      });

      mockCalculateAmount.mockReturnValue({
        amount: new BigNumber(990),
        totalSpent: new BigNumber(1001),
      });

      const transaction: Transaction = {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(poorAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("does not add error when balance equals total spent", async () => {
      const mockTransparentBalance = new BigNumber(1000);
      const mockPrivateBalance = new BigNumber(0);
      const mockBalance = mockTransparentBalance.plus(mockPrivateBalance);
      const sufficientAccount = getMockedAccount({
        balance: mockBalance,
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: mockTransparentBalance,
          privateBalance: mockPrivateBalance,
        },
      });
      mockCalculateAmount.mockReturnValue({
        amount: new BigNumber(995),
        totalSpent: new BigNumber(1000),
      });

      const transaction: Transaction = {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(sufficientAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("private record validation", () => {
    const privateAccount = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        privateBalance: new BigNumber(2000000),
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      },
    });

    const privateTransaction: Transaction = {
      ...mockTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    };

    it("adds error when private amount record commitment is missing", async () => {
      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          amountRecordCommitments: [],
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.amountRecord).toBeInstanceOf(AleoAmountRecordRequired);
    });

    it("adds error when private amount record cannot be resolved", async () => {
      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          amountRecordCommitments: ["missing-amount-record"],
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.amountRecord).toBeInstanceOf(AleoAmountRecordRequired);
    });

    it("adds error when private amount exceeds the selected record value", async () => {
      const oversizedAmount = new BigNumber("900000");
      mockCalculateAmount.mockReturnValue({
        amount: oversizedAmount,
        totalSpent: oversizedAmount.plus(mockFees),
      });

      const transaction: Transaction = {
        ...privateTransaction,
        amount: oversizedAmount,
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds error when more than MAX_PRIVATE_RECORDS_PER_TRANSACTION records are selected", async () => {
      const manyRecords = Array.from(
        { length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 },
        (_, i) => ({
          ...mockUnspentRecord1,
          commitment: `multi-record-${i}`,
        }),
      );

      const manyRecordsAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(9999999),
          unspentPrivateRecords: manyRecords,
        },
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          amountRecordCommitments: manyRecords.map(r => r.commitment),
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(manyRecordsAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AleoTooManyRecordsSelected);
      expect(result.errors.amount).toMatchObject({ count: MAX_PRIVATE_RECORDS_PER_TRANSACTION });
    });

    it("adds error when more than MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION token records are selected", async () => {
      const manyTokenRecords = Array.from(
        { length: MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION + 1 },
        (_, i) => ({
          ...mockUnspentTokenRecord1,
          commitment: `token-record-${i}`,
        }),
      );
      const mockTokenAccountWithManyRecords = {
        ...mockTokenAccount,
        unspentPrivateRecords: manyTokenRecords,
        privateBalance: new BigNumber(9999999),
      };
      const account = getMockedAccount({
        subAccounts: [mockTokenAccountWithManyRecords],
      });
      const transaction: Transaction = {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        subAccountId: mockTokenAccountWithManyRecords.id,
        properties: {
          amountRecordCommitments: manyTokenRecords.map(record => record.commitment),
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.amount).toBeInstanceOf(AleoTooManyRecordsSelected);
      expect(result.errors.amount).toMatchObject({
        count: MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
      });
    });

    it("allows native fee record to share a commitment string with a token amount record (different pools)", async () => {
      const sharedCommitment = "shared-commitment";
      const sharedNativeRecord = { ...mockUnspentRecord2, commitment: sharedCommitment };
      const mockTokenAccountWithSharedRecord = getMockedTokenAccount(undefined, {
        unspentPrivateRecords: [{ ...mockUnspentTokenRecord1, commitment: sharedCommitment }],
      });
      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(2000000),
          unspentPrivateRecords: [mockUnspentRecord1, sharedNativeRecord],
        },
        subAccounts: [mockTokenAccountWithSharedRecord],
      });

      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        subAccountId: mockTokenAccount.id,
        properties: {
          amountRecordCommitments: [sharedCommitment],
          feeRecordCommitment: sharedCommitment,
        },
      });

      expect(result.errors.feeRecord).toBeUndefined();
    });

    it("adds error when private fee record is missing and fee is not sponsored", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(AleoFeeRecordRequired);
    });

    it("adds error when private fee record cannot be resolved and fee is not sponsored", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          feeRecordCommitment: "missing-fee-record",
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(AleoFeeRecordRequired);
    });

    it("adds error when private fee record matches the amount record and fee is not sponsored", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          feeRecordCommitment: mockUnspentRecord1.commitment,
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(AleoFeeRecordRequired);
    });

    it("adds a two-records error when only one non-zero private record is available", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });

      const singleRecordAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(800000),
          unspentPrivateRecords: [mockUnspentRecord1],
        },
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          amountRecordCommitments: [mockUnspentRecord1.commitment],
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(singleRecordAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(AleoTwoRecordsRequired);
    });

    it("does not add AleoTwoRecordsRequired for token private tx with exactly 1 native record when fee record is valid", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const tokenAccount = getMockedTokenAccount(undefined, {
        unspentPrivateRecords: [mockUnspentTokenRecord1],
        privateBalance: new BigNumber(800000),
      });
      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          unspentPrivateRecords: [mockUnspentRecord1], // exactly 1 native record
        },
        subAccounts: [tokenAccount],
      });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        subAccountId: tokenAccount.id,
        properties: {
          amountRecordCommitments: [mockUnspentTokenRecord1.commitment],
          feeRecordCommitment: mockUnspentRecord1.commitment, // the 1 native record used for fee
        },
      });

      expect(result.errors.feeRecord).not.toBeInstanceOf(AleoTwoRecordsRequired);
      expect(result.errors.feeRecord).toBeUndefined();
    });

    it("adds AleoFeeRecordRequired (not AleoTwoRecordsRequired) for token private tx with 1 native record and no fee record selected", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const tokenAccount = getMockedTokenAccount(undefined, {
        unspentPrivateRecords: [mockUnspentTokenRecord1],
        privateBalance: new BigNumber(800000),
      });
      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          unspentPrivateRecords: [mockUnspentRecord1], // exactly 1 native record
        },
        subAccounts: [tokenAccount],
      });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        subAccountId: tokenAccount.id,
        properties: {
          amountRecordCommitments: [mockUnspentTokenRecord1.commitment],
          feeRecordCommitment: null,
        },
      });

      expect(result.errors.feeRecord).not.toBeInstanceOf(AleoTwoRecordsRequired);
      expect(result.errors.feeRecord).toBeInstanceOf(AleoFeeRecordRequired);
    });

    it("adds an insufficient-balance fee-record error when the selected fee record cannot cover fees", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });

      const smallFeeRecord = {
        ...mockUnspentRecord2,
        commitment: "small-fee-record",
        microcredits: "1000",
        decryptedData: {
          ...mockUnspentRecord2.decryptedData,
          data: { microcredits: "1000u64.private" },
        },
      };

      const limitedAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(801000),
          unspentPrivateRecords: [mockUnspentRecord1, smallFeeRecord],
        },
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          amountRecordCommitments: [mockUnspentRecord1.commitment],
          feeRecordCommitment: smallFeeRecord.commitment,
        },
      };

      const result = await getTransactionStatus(limitedAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(AleoFeeRecordInsufficientBalance);
    });

    it("does not add fee-record error for sponsored private fees", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          ...privateTransaction.properties,
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.feeRecord).toBeUndefined();
    });

    it("adds error when auto-picking finds no records and private balance is zero", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({
        ...mockConfig,
        recordPickingStrategy: "auto",
      });

      const emptyAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(0),
          unspentPrivateRecords: [],
        },
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: { amountRecordCommitments: [], feeRecordCommitment: null },
      };

      const result = await getTransactionStatus(emptyAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds error when auto-picking finds no records and amount exceeds private balance", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({
        ...mockConfig,
        recordPickingStrategy: "auto",
      });

      const smallBalanceAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          privateBalance: new BigNumber(100),
          unspentPrivateRecords: [mockUnspentRecord1],
        },
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: { amountRecordCommitments: [], feeRecordCommitment: null },
      };

      const result = await getTransactionStatus(smallBalanceAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("adds error when auto-picking finds no records but balance would cover amount", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({
        ...mockConfig,
        recordPickingStrategy: "auto",
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: { amountRecordCommitments: [], feeRecordCommitment: null },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AleoAmountTooLargeForTransaction);
    });

    it("does not add errors when auto-picked records cover the amount", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({
        ...mockConfig,
        recordPickingStrategy: "auto",
      });

      const transaction: Transaction = {
        ...privateTransaction,
        properties: {
          amountRecordCommitments: [mockUnspentRecord1.commitment],
          feeRecordCommitment: null,
        },
      };

      const result = await getTransactionStatus(privateAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
      expect(result.errors.amountRecord).toBeUndefined();
    });
  });

  describe("fee validation", () => {
    it.each([
      [
        "public token transfer",
        {
          ...mockTransaction,
          mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
          subAccountId: mockTokenAccount.id,
        },
      ],
      [
        "public native transfer",
        {
          ...mockTransaction,
          mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        },
      ],
    ])("adds error when native balance cannot cover fees in %s", async (_, transaction) => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const insufficientAccount = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: mockFees.minus(1),
        },
        subAccounts: [mockTokenAccount],
      });

      const result = await getTransactionStatus(insufficientAccount, transaction);

      expect(result.errors.fees).toBeInstanceOf(NotEnoughBalance);
    });

    it("does not add fees error for token transaction when native balance covers fees", async () => {
      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: mockFees,
          privateBalance: new BigNumber(2000000),
          unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        },
        subAccounts: [mockTokenAccount],
      });

      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
        subAccountId: mockTokenAccount.id,
      });

      expect(result.errors.fees).toBeUndefined();
    });

    it("does not add fees error for sponsored token transaction with low native balance", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });
      mockCalculateAmount.mockReturnValue({ amount: mockAmount, totalSpent: mockAmount });

      const result = await getTransactionStatus(mockAccountWithTokenAccount, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
        subAccountId: mockTokenAccount.id,
      });

      expect(result.errors.fees).toBeUndefined();
    });

    it("does not add fees error for private transfer with low transparent balance when fee record is valid", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: false });
      mockCalculateAmount.mockReturnValue({
        amount: mockAmount,
        totalSpent: mockAmount.plus(mockFees),
      });

      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: new BigNumber(100),
          privateBalance: new BigNumber(2000000),
          unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        },
      });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: {
          amountRecordCommitments: [mockUnspentRecord1.commitment],
          feeRecordCommitment: mockUnspentRecord2.commitment,
        },
      });

      expect(result.errors.fees).toBeUndefined();
      expect(result.errors.feeRecord).toBeUndefined();
    });

    it("does not add fees error for sponsored private transfer without fee record", async () => {
      mockAleoConfig.getCoinConfig.mockReturnValue({ ...mockConfig, isFeeSponsored: true });
      mockCalculateAmount.mockReturnValue({
        amount: mockAmount,
        totalSpent: mockAmount.plus(mockFees),
      });

      const account = getMockedAccount({
        aleoResources: {
          ...mockAleoResources,
          transparentBalance: new BigNumber(100),
          privateBalance: new BigNumber(2000000),
          unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
        },
      });

      const result = await getTransactionStatus(account, {
        ...mockTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: {
          amountRecordCommitments: [mockUnspentRecord1.commitment],
          feeRecordCommitment: null,
        },
      });

      expect(result.errors.fees).toBeUndefined();
      expect(result.errors.feeRecord).toBeUndefined();
    });
  });

  describe("error prioritization", () => {
    it("shows recipient error even when amount is also invalid", async () => {
      mockValidateAddress.mockResolvedValue(false);
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "invalid",
        amount: new BigNumber(0),
        useAllAmount: false,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("replaces amount required error with insufficient balance when both apply", async () => {
      mockCalculateAmount.mockReturnValue({
        amount: new BigNumber(0),
        totalSpent: new BigNumber(2000000),
      });

      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: false,
        mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });
});
