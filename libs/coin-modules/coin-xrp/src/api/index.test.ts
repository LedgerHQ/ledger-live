import { RIPPLE_EPOCH } from "../logic";
import { createApi } from "./index";

const mockGetServerInfos = jest.fn().mockResolvedValue({
  info: {
    complete_ledgers: "1-2",
  },
});
const mockGetTransactions = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
  getTransactions: () => mockGetTransactions(),
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
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          value: expectedValue,
          fee: fee,
          block: {
            hash: "HASH_VALUE_BLOCK",
            height: 1,
            time: new Date("2000-01-01T00:00:01Z"),
          },
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
          details: {
            memos: [
              {
                type: "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
                data: "72656e74",
              },
            ],
          },
        },
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          value: expectedValue,
          fee: fee,
          block: {
            hash: "HASH_VALUE_BLOCK",
            height: 1,
            time: new Date("2000-01-01T00:00:01Z"),
          },
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
          details: {
            destinationTag: 509555,
          },
        },
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          value: expectedValue,
          fee: fee,
          block: {
            hash: "HASH_VALUE_BLOCK",
            height: 1,
            time: new Date("2000-01-01T00:00:01Z"),
          },
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
        },
      ]);
    },
  );
});
