import { Operation, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import * as LogicFunctions from "../logic";
import { GetTransactionsOptions } from "../network";
import { NetworkInfo, XrpAsset } from "../types";
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
        meta: { delivered_amount: deliveredAmount.toString() },
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
        meta: { delivered_amount: deliveredAmount.toString() },
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
        meta: { delivered_amount: deliveredAmount.toString() },
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
    const [results, _] = await api.listOperations("src", { minHeight: 0 });

    // called 10 times because there is a hard limit of 10 iterations in case something goes wrong
    // with interpretation of the token (bug / explorer api changed ...)
    expect(mockGetServerInfos).toHaveBeenCalledTimes(10);
    expect(mockGetTransactions).toHaveBeenCalledTimes(10);

    expect(results.length).toBe(txs.length * 10);
  });

  it("should pass the token returned by previous calls", async () => {
    const txs = givenTxs(BigInt(10), BigInt(10), "src", "dest");
    mockGetTransactions
      .mockReturnValueOnce(mockNetworkTxs(txs, defaultMarker))
      .mockReturnValueOnce(mockNetworkTxs(txs, undefined));

    const [results, _] = await api.listOperations("src", { minHeight: 0 });

    // called 2 times because the second time there is no marker
    expect(mockGetServerInfos).toHaveBeenCalledTimes(2);
    expect(mockGetTransactions).toHaveBeenCalledTimes(2);

    // check tokens are passed
    const baseOptions = {
      ledger_index_min: 1,
      limit: 200,
      forward: true,
    };
    expect(mockGetTransactions).toHaveBeenNthCalledWith(1, "src", baseOptions);
    const optionsWithToken = {
      ...baseOptions,
      marker: defaultMarker,
    };
    expect(mockGetTransactions).toHaveBeenNthCalledWith(2, "src", optionsWithToken);

    expect(results.length).toBe(txs.length * 2);
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
      const [results, _] = await api.listOperations(address, { minHeight: 0 });

      // Then
      // called twice because the marker is set the first time
      expect(mockGetServerInfos).toHaveBeenCalledTimes(2);
      expect(mockGetTransactions).toHaveBeenCalledTimes(2);

      // if expectedType is "OUT", compute value with fees (i.e. delivered_amount + Fee)
      const expectedValue = expectedType === "IN" ? deliveredAmount : deliveredAmount + fee;
      // the order is reversed so that the result is always sorted by newest tx first element of the list
      expect(results).toEqual([
        {
          asset: { type: "native" },
          operationIndex: 0,
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: expectedValue,
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
          asset: { type: "native" },
          operationIndex: 0,
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: expectedValue,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            sequence: 1,
            xrpTxType: "Payment",
            destinationTag: 509555,
          },
        },
        {
          asset: { type: "native" },
          operationIndex: 0,
          tx: {
            hash: "HASH_VALUE",
            fees: fee,
            date: new Date(1000000 + LogicFunctions.RIPPLE_EPOCH * 1000),
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
          },
          type: expectedType,
          value: expectedValue,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            xrpTxType: "Payment",
            sequence: 1,
          },
        },
      ] satisfies Operation<XrpAsset>[]);
    },
  );
});

describe("Testing craftTransaction function", () => {
  const DEFAULT_ESTIMATED_FEES = 100n;
  const api = createApi({ node: "https://localhost" });
  const logicCraftTransactionSpy = jest
    .spyOn(LogicFunctions, "craftTransaction")
    .mockImplementation((_address, _transaction, _publicKey) => {
      return Promise.resolve({ xrplTransaction: {} as never, serializedTransaction: "" });
    });

  beforeAll(() => {
    jest
      .spyOn(LogicFunctions, "getNextValidSequence")
      .mockImplementation(_address => Promise.resolve(0));

    jest.spyOn(LogicFunctions, "estimateFees").mockImplementation(_networkInfo => {
      return Promise.resolve({
        networkInfo: {} as NetworkInfo,
        fee: DEFAULT_ESTIMATED_FEES,
      });
    });
  });

  it("should use custom user fees when user provides it for crafting a transaction", async () => {
    const customFees = 99n;
    await api.craftTransaction({} as TransactionIntent<XrpAsset>, customFees);

    expect(logicCraftTransactionSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        fee: customFees,
      }),
    );
  });

  it("should use default fees when user does not provide them for crafting a transaction", async () => {
    await api.craftTransaction({} as TransactionIntent<XrpAsset>);

    expect(logicCraftTransactionSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        fee: DEFAULT_ESTIMATED_FEES,
      }),
    );
  });
});
