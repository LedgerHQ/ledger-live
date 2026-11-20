import BigNumber from "bignumber.js";
import {
  getMockedAccount,
  getMockedTokenAccount,
  mockUnspentRecord1,
} from "../__tests__/fixtures/account.fixture";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Transaction } from "../types";
import { TRANSACTION_TYPE } from "../constants";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("./prepareTransaction");
jest.mock("./createTransaction");

const mockPrepareTransaction = jest.mocked(prepareTransaction);
const mockCreateTransaction = jest.mocked(createTransaction);

describe("estimateMaxSpendable", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockPreparedTransaction: Transaction = {
    family: "aleo",
    amount: new BigNumber(995000),
    useAllAmount: true,
    recipient: "",
    fees: new BigNumber(5000),
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrepareTransaction.mockResolvedValue(mockPreparedTransaction);
    mockCreateTransaction.mockReturnValue({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
  });

  it("should return the amount from prepared transaction", async () => {
    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(mockPreparedTransaction.amount);
  });

  it("should return zero when prepared transaction amount is zero", async () => {
    const mockPoorAccount = getMockedAccount({ balance: new BigNumber(3000) });

    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      amount: new BigNumber(0),
    });

    const result = await estimateMaxSpendable({
      account: mockPoorAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("should call prepareTransaction with useAllAmount true", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: {
        ...mockPreparedTransaction,
        useAllAmount: false,
      },
    });

    expect(mockPrepareTransaction).toHaveBeenCalledTimes(1);
    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mockAccount,
      expect.objectContaining({ useAllAmount: true }),
    );
  });

  it("should fallback to createTransaction when transaction is not provided", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    expect(mockCreateTransaction).toHaveBeenCalledWith(mockAccount);
  });

  it("should return zero for private tx when amountRecordCommitments is empty", async () => {
    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      amount: new BigNumber(0),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    });

    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: {
        ...mockPreparedTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: {
          amountRecordCommitments: [],
          feeRecordCommitment: null,
        },
      },
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("should return microcredits value for private tx when amountRecordCommitments has an entry", async () => {
    const commitment = "record-1-commitment";
    const privateRecordAmount = "12345";
    const aleoResources = mockAccount.aleoResources!;
    const accountWithPrivateRecord = getMockedAccount({
      aleoResources: {
        ...aleoResources,
        unspentPrivateRecords: [
          {
            ...mockUnspentRecord1,
            commitment,
            microcredits: privateRecordAmount,
          },
        ],
      },
    });

    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      amount: new BigNumber(privateRecordAmount),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [commitment],
        feeRecordCommitment: null,
      },
    });

    const result = await estimateMaxSpendable({
      account: accountWithPrivateRecord,
      parentAccount: undefined,
      transaction: {
        ...mockPreparedTransaction,
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: {
          amountRecordCommitments: [commitment],
          feeRecordCommitment: null,
        },
      },
    });

    expect(result).toEqual(new BigNumber(privateRecordAmount));
  });

  it("should return zero for private tx when amountRecordCommitments has an entry but no record matches", async () => {
    const commitment = "record-1-commitment";
    const aleoResources = mockAccount.aleoResources!;
    const accountWithoutMatchingRecord = getMockedAccount({
      aleoResources: {
        ...aleoResources,
        unspentPrivateRecords: [
          {
            ...mockUnspentRecord1,
            commitment: "different-commitment",
          },
        ],
      },
    });

    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      amount: new BigNumber(0),
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [commitment],
        feeRecordCommitment: null,
      },
    });

    await expect(
      estimateMaxSpendable({
        account: accountWithoutMatchingRecord,
        parentAccount: undefined,
        transaction: {
          ...mockPreparedTransaction,
          mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          properties: {
            amountRecordCommitments: [commitment],
            feeRecordCommitment: null,
          },
        },
      }),
    ).resolves.toEqual(new BigNumber(0));
  });
});

describe("estimateMaxSpendable, filters", () => {
  // Rows wide enough that they never cap the mocked prepared amount.
  const rows = [
    { value: new BigNumber(2_000_000) },
    { value: new BigNumber(2_000_000), private: true },
  ];
  const mockAccount = { ...getMockedAccount({ balance: new BigNumber(1000000) }), balances: rows };
  const tokenAccount = { ...getMockedTokenAccount(), balances: rows };
  const mainWithToken = getMockedAccount({ subAccounts: [tokenAccount] });
  const prepared: Transaction = {
    family: "aleo",
    amount: new BigNumber(995000),
    useAllAmount: true,
    recipient: "",
    fees: new BigNumber(5000),
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };
  const emptyPrivateProperties = { amountRecordCommitments: [], feeRecordCommitment: null };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareTransaction.mockResolvedValue(prepared);
    mockCreateTransaction.mockReturnValue({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
  });

  it("estimates the public max for private: false on the main account", async () => {
    const result = await estimateMaxSpendable({
      account: mockAccount,
      transaction: undefined,
      filters: { private: false },
    });

    expect(result).toEqual(prepared.amount);
    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mockAccount,
      expect.objectContaining({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC, useAllAmount: true }),
    );
    expect(mockPrepareTransaction.mock.calls[0][1]).not.toHaveProperty("properties");
  });

  it("estimates the private max for private: true on the main account", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      transaction: undefined,
      filters: { private: true },
    });

    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mockAccount,
      expect.objectContaining({
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: emptyPrivateProperties,
        useAllAmount: true,
      }),
    );
  });

  it("replaces the mode and properties of a given transaction", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      transaction: {
        ...prepared,
        mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        properties: { amountRecordCommitments: ["c1"], feeRecordCommitment: "c2" },
      },
      filters: { private: false },
    });

    expect(mockPrepareTransaction.mock.calls[0][1]).toMatchObject({
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
    expect(mockPrepareTransaction.mock.calls[0][1]).not.toHaveProperty("properties");
  });

  it("estimates the token's public max for private: false on a token account", async () => {
    await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount: mainWithToken,
      transaction: undefined,
      filters: { private: false },
    });

    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mainWithToken,
      expect.objectContaining({
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
        subAccountId: tokenAccount.id,
      }),
    );
  });

  it("estimates the token's private max for private: true on a token account", async () => {
    await estimateMaxSpendable({
      account: tokenAccount,
      parentAccount: mainWithToken,
      transaction: undefined,
      filters: { private: true },
    });

    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mainWithToken,
      expect.objectContaining({
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        properties: emptyPrivateProperties,
        subAccountId: tokenAccount.id,
      }),
    );
  });

  it("keeps the transaction's mode when the filters hold no private flag", async () => {
    await estimateMaxSpendable({ account: mockAccount, transaction: undefined, filters: {} });

    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mockAccount,
      expect.objectContaining({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
    );
  });

  it.each([
    ["alone", { pools: ["transparent"] }],
    ["with a private flag", { pools: ["transparent"], private: false }],
    ["empty", { pools: [] }],
  ])("throws when pools is given %s", async (_label, filters) => {
    await expect(
      estimateMaxSpendable({ account: mockAccount, transaction: undefined, filters }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
    expect(mockPrepareTransaction).not.toHaveBeenCalled();
  });
});
