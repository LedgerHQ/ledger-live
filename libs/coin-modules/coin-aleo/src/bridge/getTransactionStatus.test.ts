import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { getMockedAccount, mockAleoResources } from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { estimateFees, validateAddress } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
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
