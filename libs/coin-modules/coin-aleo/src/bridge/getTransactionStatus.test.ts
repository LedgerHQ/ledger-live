import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedTransaction } from "../__tests__/fixtures/transaction.fixture";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../logic");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  calculateAmount: jest.fn(),
}));

const mockCalculateAmount = jest.mocked(calculateAmount);
const mockEstimateFees = jest.mocked(estimateFees);
const mockValidateAddress = jest.mocked(validateAddress);

describe("getTransactionStatus", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockFees = new BigNumber(5000);
  const mockAmount = new BigNumber(500000);
  const mockTransaction = getMockedTransaction({ amount: new BigNumber(500000) });
  const mockGetCoinConfig = jest.spyOn(aleoCoinConfig, "getCoinConfig");

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue(getMockedConfig());
    mockEstimateFees.mockResolvedValue(mockFees);
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

    it("adds error when recipient is same as sender address for regular transfer", async () => {
      const account = getMockedAccount({ freshAddress: "aleo1sender" });
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "aleo1sender",
      };

      const result = await getTransactionStatus(account, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("allows self-transfer when transaction type is self-transfer", async () => {
      const account = getMockedAccount({ freshAddress: "aleo1sender" });
      const transaction: Transaction = {
        ...mockTransaction,
        type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
        recipient: "aleo1sender",
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
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("allows zero amount when useAllAmount is true", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: true,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeUndefined();
    });

    it("adds error when total spent exceeds balance", async () => {
      mockCalculateAmount.mockReturnValue({
        amount: mockAmount,
        totalSpent: new BigNumber(2000000),
      });

      const result = await getTransactionStatus(mockAccount, mockTransaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("does not add error when balance equals total spent", async () => {
      const account = getMockedAccount({ balance: new BigNumber(1000) });
      mockCalculateAmount.mockReturnValue({
        amount: new BigNumber(995),
        totalSpent: new BigNumber(1000),
      });

      const result = await getTransactionStatus(account, mockTransaction);

      expect(result.errors.amount).toBeUndefined();
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
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("shows insufficient balance error when amount is zero and balance is exceeded", async () => {
      mockCalculateAmount.mockReturnValue({
        amount: new BigNumber(0),
        totalSpent: new BigNumber(2000000),
      });

      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: false,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("private transactions validation", () => {
    it("adds error when amountRecord is missing for private transfer", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        amountRecord: null,
        feeRecord: "some_fee_record",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amountRecord).toBeInstanceOf(Error);
    });

    it("adds error when feeRecord is missing for private transfer", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        amountRecord: "some_amount_record",
        feeRecord: null,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.feeRecord).toBeInstanceOf(Error);
    });

    it("adds error when amountRecord is missing for convert private to public", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        amountRecord: null,
        feeRecord: "some_fee_record",
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amountRecord).toBeInstanceOf(Error);
    });

    it("adds both errors when both records are missing for private transaction", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        amountRecord: null,
        feeRecord: null,
      };

      const result = await getTransactionStatus(mockAccount, transaction);

      expect(result.errors.amountRecord).toBeInstanceOf(Error);
      expect(result.errors.feeRecord).toBeInstanceOf(Error);
    });
  });

  describe("unsupported transaction types", () => {
    it("throws error for unsupported transaction type", async () => {
      const transaction = {
        ...mockTransaction,
        type: "UNSUPPORTED_TYPE" as any,
      };

      await expect(getTransactionStatus(mockAccount, transaction)).rejects.toThrow();
    });
  });
});
