import { assert } from "console";
import { listOperations } from "./listOperations";
import { RIPPLE_EPOCH } from "./utils";

const maxHeight = 2;
const minHeight = 1;
const mockGetServerInfos = jest.fn().mockResolvedValue({
  info: {
    complete_ledgers: `${minHeight}-${maxHeight}`,
  },
});
const mockGetTransactions = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
  getTransactions: () => mockGetTransactions(),
}));

describe("listOperations", () => {
  afterEach(() => {
    mockGetServerInfos.mockClear();
    mockGetTransactions.mockClear();
  });

  it("when there are no transactions then the result is empty", async () => {
    // Given
    mockGetTransactions.mockResolvedValue([]);
    // When
    const [results, token] = await listOperations("any address", { minHeight: 0 });
    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockGetTransactions).toHaveBeenCalledTimes(1);
    expect(results).toEqual([]);
    expect(token).toEqual(minHeight);
  });

  it("when there are no transactions and a limit then the result is empty", async () => {
    // Given
    mockGetTransactions.mockResolvedValue([]);
    // When
    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 1 });
    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockGetTransactions).toHaveBeenCalledTimes(1);
    expect(results).toEqual([]);
    expect(token).toEqual(minHeight);
  });

  const paymentTx = {
    ledger_hash: "HASH_VALUE_BLOCK",
    hash: "HASH_VALUE",
    close_time_iso: "2000-01-01T00:00:01Z",
    meta: { delivered_amount: "100" },
    tx_json: {
      TransactionType: "Payment",
      Fee: "1",
      ledger_index: 2,
      date: 1000,
      Account: "sender",
      Destination: "dest",
      Sequence: 1,
    },
  };
  const otherTx = { ...paymentTx, tx_json: { ...paymentTx.tx_json, TransactionType: "Other" } };

  it("should only list operations of type payment", async () => {
    // Given
    const lastTransaction = paymentTx;
    mockGetTransactions.mockResolvedValueOnce([paymentTx, otherTx, lastTransaction]);
    mockGetTransactions.mockResolvedValue([]); // subsequent calls

    // When
    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 3 });

    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called twice because first call yields only 2 transactions, and 3 are asked
    expect(mockGetTransactions).toHaveBeenCalledTimes(2);
    expect(results.length).toEqual(2);
    expect(token).toEqual(lastTransaction.tx_json.ledger_index - 1);
  });

  it("should make enough calls so that the limit requested is satified", async () => {
    const lastTransaction = otherTx;
    const txs = [paymentTx, paymentTx, otherTx, otherTx, otherTx, otherTx, otherTx, otherTx];
    assert(txs.length === 8);
    mockGetTransactions.mockResolvedValue(txs);

    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 8 });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called 4 times because each call yields only 2 transactions, and 8 are asked
    expect(mockGetTransactions).toHaveBeenCalledTimes(4);
    expect(results.length).toEqual(8);
    expect(token).toEqual(lastTransaction.tx_json.ledger_index - 1);
  });

  it("should make enough calls, even if there is not enough txs to satisfy the limit", async () => {
    mockGetTransactions.mockResolvedValueOnce([otherTx, otherTx, otherTx, otherTx]);
    mockGetTransactions.mockResolvedValueOnce([paymentTx, paymentTx]);
    mockGetTransactions.mockResolvedValue([]); // subsequent calls
    const lastTransaction = paymentTx;

    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 4 });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called 2 times because the second call is a shortage of txs
    expect(mockGetTransactions).toHaveBeenCalledTimes(2);
    expect(results.length).toEqual(2);
    expect(token).toEqual(lastTransaction.tx_json.ledger_index - 1);
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
    "should return the list of operations associated to an account",
    async ({ address, opSender, opDestination, expectedType }) => {
      // Given
      const deliveredAmount = 100;
      const fee = 10;
      mockGetTransactions.mockResolvedValue([
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
      ]);

      // When
      const [results, _] = await listOperations(address, { minHeight: 0 });

      // Then
      expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
      expect(mockGetTransactions).toHaveBeenCalledTimes(1);
      // if expectedType is "OUT", compute value with fees (i.e. delivered_amount + Fee)
      const expectedValue =
        expectedType === "IN" ? BigInt(deliveredAmount) : BigInt(deliveredAmount + fee);
      expect(results).toEqual([
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          simpleType: expectedType,
          value: expectedValue,
          fee: BigInt(10),
          blockHeight: 1,
          blockHash: "HASH_VALUE_BLOCK",
          blockTime: new Date("2000-01-01T00:00:01Z"),
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
        },
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          simpleType: expectedType,
          value: expectedValue,
          fee: BigInt(10),
          blockHeight: 1,
          blockHash: "HASH_VALUE_BLOCK",
          blockTime: new Date("2000-01-01T00:00:01Z"),
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
          simpleType: expectedType,
          value: expectedValue,
          fee: BigInt(10),
          blockHeight: 1,
          blockHash: "HASH_VALUE_BLOCK",
          blockTime: new Date("2000-01-01T00:00:01Z"),
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
      ]);
    },
  );
});
