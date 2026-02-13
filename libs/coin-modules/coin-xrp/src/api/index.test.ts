import { Operation, SendTransactionIntent } from "@ledgerhq/coin-framework/api/types";
import * as LogicFunctions from "../logic";
import { GetTransactionsOptions } from "../network";
import { NetworkInfo, XrpMapMemo } from "../types";
import { createApi } from "./index";

const mockGetServerInfos = jest.fn().mockResolvedValue({
  info: {
    complete_ledgers: "1-2",
  },
});
const mockGetTransactions = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
  getTransactions: (address: string, options: GetTransactionsOptions) =>
    mockGetTransactions(address, options),
}));

// Module-level mocks for logic functions
const mockCraftTransaction = jest.fn();
const mockGetNextValidSequence = jest.fn();
const mockEstimateFees = jest.fn();

jest.mock("../logic", () => ({
  ...jest.requireActual("../logic"),
  craftTransaction: (...args: unknown[]) => mockCraftTransaction(...args),
  getNextValidSequence: (...args: unknown[]) => mockGetNextValidSequence(...args),
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
}));

describe("listOperations", () => {
  const api = createApi({ node: "https://localhost" });

  afterEach(() => {
    mockGetServerInfos.mockClear();
    mockGetTransactions.mockClear();
  });

  const defaultMarker = { ledger: 1, seq: 1 };
  function mockNetworkTxs(txs: unknown, marker: undefined | unknown): unknown {
    return {
      account: "account",
      ledger_index_max: 1,
      ledger_index_min: 1,
      limit: 1,
      validated: false,
      transactions: txs,
      marker: marker,
      error: "",
    };
  }

  function givenTxs(
    fee: bigint,
    deliveredAmount: bigint,
    opSender: string,
    opDestination: string,
  ): unknown[] {
    return [
      {
        ledger_hash: "HASH_VALUE_BLOCK",
        hash: "HASH_VALUE",
        close_time_iso: "2000-01-01T00:00:01Z",
        meta: {
          delivered_amount: deliveredAmount.toString(),
          TransactionResult: "tesSUCCESS",
        },
        tx_json: {
          TransactionType: "Payment",
          Fee: fee.toString(),
          ledger_index: 1,
          date: 1000,
          Account: opSender,
          Destination: opDestination,
          Sequence: 1,
        },
      },
      {
        ledger_hash: "HASH_VALUE_BLOCK",
        hash: "HASH_VALUE",
        close_time_iso: "2000-01-01T00:00:01Z",
        meta: {
          delivered_amount: deliveredAmount.toString(),
          TransactionResult: "tecAMM_ACCOUNT",
        },
        tx_json: {
          TransactionType: "Payment",
          Fee: fee.toString(),
          ledger_index: 1,
          date: 1000,
          Account: opSender,
          Destination: opDestination,
          DestinationTag: 509555,
          Sequence: 1,
        },
      },
      {
        ledger_hash: "HASH_VALUE_BLOCK",
        hash: "HASH_VALUE",
        close_time_iso: "2000-01-01T00:00:01Z",
        meta: {
          delivered_amount: deliveredAmount.toString(),
          TransactionResult: "tesSUCCESS",
        },
        tx_json: {
          TransactionType: "Payment",
          Fee: fee.toString(),
          ledger_index: 1,
          date: 1000,
          Account: opSender,
          Destination: opDestination,
          Memos: [
            {
              Memo: {
                MemoType: "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
                MemoData: "72656e74",
              },
            },
          ],
          Sequence: 1,
        },
      },
    ];
  }

  it("should kill the loop after 10 iterations", async () => {
    const txs = givenTxs(BigInt(10), BigInt(10), "src", "dest");
    // each time it's called it returns a marker, so in theory it would loop forever
    mockGetTransactions.mockResolvedValue(mockNetworkTxs(txs, defaultMarker));
    const { items: results } = await api.listOperations("src", { minHeight: 0, order: "asc" });

    // called 1 times because the client is expected to do the pagination itself
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockGetTransactions).toHaveBeenCalledTimes(1);

    expect(results.length).toBe(txs.length);
  });

  it("should pass the token returned by previous calls", async () => {
    const txs = givenTxs(BigInt(10), BigInt(10), "src", "dest");
    mockGetTransactions
      .mockReturnValueOnce(mockNetworkTxs(txs, defaultMarker))
      .mockReturnValueOnce(mockNetworkTxs(txs, undefined));

    const { items: results, next: token } = await api.listOperations("src", {
      minHeight: 0,
      order: "asc",
    });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockGetTransactions).toHaveBeenCalledTimes(1);

    // check tokens are passed
    const baseOptions = {
      ledger_index_min: 1,
      limit: 200,
      forward: true,
    };
    expect(mockGetTransactions).toHaveBeenNthCalledWith(1, "src", baseOptions);
    await api.listOperations("src", { minHeight: 0, cursor: token, order: "asc" });
    const optionsWithToken = {
      ...baseOptions,
      marker: defaultMarker,
    };
    expect(mockGetTransactions).toHaveBeenNthCalledWith(2, "src", optionsWithToken);

    expect(results.length).toBe(txs.length);
  });

  it.each([
    {
      address: "WHATEVER_ADDRESS",
      opSender: "account_addr",
      opDestination: "WHATEVER_ADDRESS",
      expectedType: "IN",
    },
    {
      address: "WHATEVER_ADDRESS",
      opSender: "WHATEVER_ADDRESS",
      opDestination: "destination_addr",
      expectedType: "OUT",
    },
  ])(
    `should return the list of operations associated to an account when expected type is %s`,
    async ({ address, opSender, opDestination, expectedType }) => {
      // Givem
      const deliveredAmount = BigInt(100);
      const fee = BigInt(10);
      mockGetTransactions.mockResolvedValueOnce(
        mockNetworkTxs(givenTxs(fee, deliveredAmount, opSender, opDestination), defaultMarker),
      );

      // second call to kill the loop
      mockGetTransactions.mockResolvedValue(mockNetworkTxs([], undefined));

      // When
      const { items: results } = await api.listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
      expect(mockGetTransactions).toHaveBeenCalledTimes(1);

      // the order is reversed so that the result is always sorted by newest tx first element of the list
      expect(results).toEqual([
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            feesPayer: opSender,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            failed: false,
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: deliveredAmount,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            sequence: 1,
            xrpTxType: "Payment",
            memos: [
              {
                type: "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
                data: "72656e74",
              },
            ],
          },
        },
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            feesPayer: opSender,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            failed: true,
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: deliveredAmount,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            sequence: 1,
            xrpTxType: "Payment",
            destinationTag: 509555,
          },
        },
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            feesPayer: opSender,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            failed: false,
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: deliveredAmount,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            xrpTxType: "Payment",
            sequence: 1,
          },
        },
      ] satisfies Operation[]);
    },
  );
});

describe("Testing craftTransaction function", () => {
  const DEFAULT_ESTIMATED_FEES = 100n;
  const api = createApi({ node: "https://localhost" });

  beforeAll(() => {
    mockCraftTransaction.mockImplementation((_address, _transaction, _publicKey) => {
      return Promise.resolve({ xrplTransaction: {} as never, serializedTransaction: "" });
    });

    mockGetNextValidSequence.mockImplementation(_address => Promise.resolve(0));

    mockEstimateFees.mockImplementation(_networkInfo => {
      return Promise.resolve({
        networkInfo: {} as NetworkInfo,
        fees: DEFAULT_ESTIMATED_FEES,
      });
    });
  });

  afterEach(() => {
    mockCraftTransaction.mockClear();
  });

  it("should use custom user fees when user provides it for crafting a transaction", async () => {
    const customFees = 99n;
    await api.craftTransaction(
      { intentType: "transaction", sender: "foo" } as SendTransactionIntent<XrpMapMemo>,
      {
        value: customFees,
      },
    );

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        fees: customFees,
      }),
      undefined,
    );
  });

  it("should use default fees when user does not provide them for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        fees: DEFAULT_ESTIMATED_FEES,
      }),
      undefined,
    );
  });

  it("should pass signing pub key when user provides it for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
      senderPublicKey: "bar",
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      "bar",
    );
  });

  it("should pass memos when user provides it for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
      memo: {
        type: "map",
        memos: new Map([["memos", ["testdata"]]]),
      },
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        // NOTE: before
        // memos: [{ data: "testdata", format: "testformat", type: "testtype" }],
        memos: [{ data: "testdata", type: "memo" }],
      }),
      undefined,
    );
  });

  it("should not pass memos when user does not provide it for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        memos: undefined,
      }),
      undefined,
    );
  });

  it("should not pass memos when user provides an empty memo list it for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
      memo: {
        type: "map",
        memos: new Map(),
      },
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        memos: undefined,
      }),
      undefined,
    );
  });

  it("should pass destination tag when user provides it for crafting a transaction", async () => {
    await api.craftTransaction({
      intentType: "transaction",
      sender: "foo",
      memo: {
        type: "map",
        memos: new Map([["destinationTag", "1337"]]),
      },
    } as SendTransactionIntent<XrpMapMemo>);

    expect(mockCraftTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        destinationTag: 1337, // logic should convert `value: string` -> `number`
      }),
      undefined,
    );
  });
});
