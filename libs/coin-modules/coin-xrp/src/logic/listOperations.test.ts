import { assert } from "console";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { Marker } from "../network/types";
import { listOperations } from "./listOperations";
import { RIPPLE_EPOCH } from "./utils";

const maxHeight = 2;
const minHeight = 1;
const mockGetServerInfos = jest.fn().mockResolvedValue({
  info: {
    complete_ledgers: `${minHeight}-${maxHeight}`,
  },
});
const mockNetworkGetTransactions = jest.fn();
jest.mock("../network", () => ({
  getServerInfos: () => mockGetServerInfos(),
  getTransactions: (...args: any[]) => mockNetworkGetTransactions(...args),
}));

describe("listOperations", () => {
  afterEach(() => {
    mockGetServerInfos.mockClear();
    mockNetworkGetTransactions.mockClear();
  });

  const someMarker: Marker = { ledger: 1, seq: 1 };
  function mockNetworkTxs(txs: unknown): unknown {
    return {
      account: "account",
      ledger_index_max: 1,
      ledger_index_min: 1,
      limit: 1,
      validated: false,
      transactions: txs,
      marker: someMarker,
      error: "",
    };
  }

  it("when there are no transactions then the result is empty", async () => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([]));
    // When
    const [results, token] = await listOperations("any address", { minHeight: 0, order: "asc" });
    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(1);
    expect(results).toEqual([]);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("when there are no transactions and a limit then the result is empty", async () => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([]));
    // When
    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 1 });
    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(1);
    expect(results).toEqual([]);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  const paymentTx = {
    ledger_hash: "HASH_VALUE_BLOCK",
    hash: "HASH_VALUE",
    validated: true,
    close_time_iso: "2000-01-01T00:00:01Z",
    meta: {
      delivered_amount: "100",
      TransactionResult: "tesSUCCESS",
    },
    tx_json: {
      TransactionType: "Payment",
      Fee: "1",
      ledger_index: 2,
      date: 1000,
      Account: "sender",
      Destination: "dest",
      Sequence: 1,
      SigningPubKey: "DEADBEEF",
    },
  };
  // Non-Payment tx whose Account does NOT match the queried address ("any address")
  const otherTx = { ...paymentTx, tx_json: { ...paymentTx.tx_json, TransactionType: "Other" } };

  // Non-Payment tx sent by "sender" — used to verify FEES operation generation
  const offerCreateTx = {
    ledger_hash: "HASH_VALUE_BLOCK",
    hash: "OFFER_HASH",
    validated: true,
    close_time_iso: "2000-01-01T00:00:01Z",
    meta: { TransactionResult: "tesSUCCESS" },
    tx_json: {
      TransactionType: "OfferCreate",
      Fee: "5",
      ledger_index: 2,
      date: 1000,
      Account: "sender",
      Sequence: 2,
      SigningPubKey: "DEADBEEF",
    },
  };

  it("should only list operations of type payment", async () => {
    // Given
    const lastTransaction = paymentTx;
    const txs = [paymentTx, otherTx, lastTransaction];
    mockNetworkGetTransactions.mockResolvedValueOnce(mockNetworkTxs(txs));
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([])); // subsequent calls

    // When
    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 3 });

    // Then
    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called twice because first call yields only 2 transactions, and 3 are asked
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(2);
    expect(results.length).toEqual(2);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("should make enough calls so that the limit requested is satisfied", async () => {
    const txs = [paymentTx, paymentTx, otherTx, otherTx, otherTx, otherTx, otherTx, otherTx];
    assert(txs.length === 8);
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs(txs));

    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 8 });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called 4 times because each call yields only 2 transactions, and 8 are asked
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(4);
    expect(results.length).toEqual(8);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("should make enough calls, even if there is not enough txs to satisfy the limit", async () => {
    mockNetworkGetTransactions.mockResolvedValueOnce(
      mockNetworkTxs([otherTx, otherTx, otherTx, otherTx]),
    );
    mockNetworkGetTransactions.mockResolvedValueOnce(mockNetworkTxs([paymentTx, paymentTx]));
    mockNetworkGetTransactions.mockResolvedValue([]); // subsequent calls

    const [results, token] = await listOperations("any address", { minHeight: 0, limit: 4 });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    // it's called 2 times because the second call is a shortage of txs
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(2);
    expect(results.length).toEqual(2);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("should handle gracefully when minHeight is higher than current ledger (future block)", async () => {
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([paymentTx]));

    const futureMinHeight = 999439370; // very high value (more than expected)
    const [results, token] = await listOperations("any address", {
      minHeight: futureMinHeight,
      order: "asc",
    });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(1);

    // Verify that ledger_index_min is NOT passed when minHeight is too high
    const callArgs = mockNetworkGetTransactions.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty("ledger_index_min");

    expect(results.length).toEqual(1);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("should use ledger_index_min when minHeight is valid (within current ledger range)", async () => {
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([paymentTx]));

    const validMinHeight = 1; // valid value (within range 1-2)
    const [results, token] = await listOperations("any address", {
      minHeight: validMinHeight,
      order: "asc",
    });

    expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
    expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(1);

    // Verify that ledger_index_min IS passed when minHeight is valid
    const callArgs = mockNetworkGetTransactions.mock.calls[0][1];
    expect(callArgs).toMatchObject({ ledger_index_min: 1 }); // Should be max(1, 1) = 1

    expect(results.length).toEqual(1);
    expect(JSON.parse(token)).toEqual(someMarker);
  });

  it("should include a FEES operation for a non-Payment tx sent by the queried address", async () => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([offerCreateTx]));

    // When
    const [results] = await listOperations("sender", { minHeight: 0, order: "asc" });

    // Then
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject<Partial<Operation>>({
      id: "OFFER_HASH",
      type: "FEES",
      value: BigInt(0),
      senders: ["sender"],
      recipients: [],
      tx: expect.objectContaining({
        hash: "OFFER_HASH",
        fees: BigInt(5),
        failed: false,
        block: {
          hash: "HASH_VALUE_BLOCK",
          height: 2,
          time: new Date("2000-01-01T00:00:01Z"),
        },
      }),
      details: {
        xrpTxType: "OfferCreate",
        sequence: 2,
        signingPubKey: "DEADBEEF",
      },
    });
  });

  it("should exclude non-Payment txs sent by other accounts from FEES operations", async () => {
    // Given — offerCreateTx has Account: "sender", but we query "other_address"
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([offerCreateTx]));

    // When
    const [results] = await listOperations("other_address", { minHeight: 0, order: "asc" });

    // Then — no Payment and no matching Account, so nothing returned
    expect(results).toHaveLength(0);
  });

  it("should return both Payment ops and FEES ops when txs contain both types", async () => {
    // Given — paymentTx (Payment from "sender") + offerCreateTx (OfferCreate from "sender")
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([paymentTx, offerCreateTx]));

    // When — query as "sender" to match both
    const [results] = await listOperations("sender", { minHeight: 0, order: "asc" });

    // Then
    expect(results).toHaveLength(2);
    expect(results.some(op => op.type === "OUT")).toBe(true);
    expect(results.some(op => op.type === "FEES")).toBe(true);
  });

  it("should mark a failed non-Payment tx as a failed FEES operation", async () => {
    // Given
    const failedOfferTx = {
      ...offerCreateTx,
      hash: "FAILED_OFFER_HASH",
      meta: { TransactionResult: "tecINSUF_RESERVE_OFFER" },
    };
    mockNetworkGetTransactions.mockResolvedValue(mockNetworkTxs([failedOfferTx]));

    // When
    const [results] = await listOperations("sender", { minHeight: 0, order: "asc" });

    // Then
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "FAILED_OFFER_HASH",
      type: "FEES",
      tx: expect.objectContaining({ failed: true }),
    });
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
      const fees = 10;
      mockNetworkGetTransactions.mockResolvedValue(
        mockNetworkTxs([
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
              Fee: fees.toString(),
              ledger_index: 1,
              date: 1000,
              Account: opSender,
              Destination: opDestination,
              Sequence: 1,
              SigningPubKey: "DEADBEEF",
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
              Fee: fees.toString(),
              ledger_index: 1,
              date: 1000,
              Account: opSender,
              Destination: opDestination,
              DestinationTag: 509555,
              Sequence: 1,
              SigningPubKey: "DEADBEEF",
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
              Fee: fees.toString(),
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
              SigningPubKey: "DEADBEEF",
            },
          },
        ]),
      );

      // When
      const [results, _] = await listOperations(address, { minHeight: 0, order: "asc" });

      // Then
      expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
      expect(mockNetworkGetTransactions).toHaveBeenCalledTimes(1);
      const expectedValue = BigInt(deliveredAmount);
      expect(results).toEqual([
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            fees: BigInt(10),
            hash: "HASH_VALUE",
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
            date: new Date(1000000 + RIPPLE_EPOCH * 1000),
            failed: false,
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
            signingPubKey: "DEADBEEF",
          },
        },
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            hash: "HASH_VALUE",
            fees: BigInt(10),
            date: new Date(1000000 + RIPPLE_EPOCH * 1000),
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
            failed: true,
          },
          type: expectedType,
          value: expectedValue,
          senders: [opSender],
          recipients: [opDestination],
          details: {
            sequence: 1,
            destinationTag: 509555,
            xrpTxType: "Payment",
            signingPubKey: "DEADBEEF",
          },
        },
        {
          id: "HASH_VALUE",
          asset: { type: "native" },
          tx: {
            hash: "HASH_VALUE",
            fees: BigInt(10),
            block: {
              hash: "HASH_VALUE_BLOCK",
              height: 1,
              time: new Date("2000-01-01T00:00:01Z"),
            },
            date: new Date(1000000 + RIPPLE_EPOCH * 1000),
            failed: false,
          },
          details: {
            sequence: 1,
            xrpTxType: "Payment",
            signingPubKey: "DEADBEEF",
          },
          type: expectedType,
          value: expectedValue,
          senders: [opSender],
          recipients: [opDestination],
        },
      ] satisfies Operation[]);
    },
  );
});
