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
      // Givem
      const deliveredAmount = 100;
      const fee = 10;
      mockGetTransactions.mockResolvedValueOnce(
        mockNetworkTxs(givenTxs(fee, deliveredAmount, opSender, opDestination), defaultMarker),
      );

      // second call to kill the loop
      mockGetTransactions.mockResolvedValue(mockNetworkTxs([], undefined));

      // When
      const [results, _] = await api.listOperations(address, { limit: 100 });

      // Then
      // called twice because the marker is set the first time
      expect(mockGetServerInfos).toHaveBeenCalledTimes(2);
      expect(mockGetTransactions).toHaveBeenCalledTimes(2);

      // if expectedType is "OUT", compute value with fees (i.e. delivered_amount + Fee)
      const expectedValue =
        expectedType === "IN" ? BigInt(deliveredAmount) : BigInt(deliveredAmount + fee);
      expect(results).toEqual([
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          value: expectedValue,
          fee: BigInt(10),
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
        {
          hash: "HASH_VALUE",
          address,
          type: "Payment",
          value: expectedValue,
          fee: BigInt(10),
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
          fee: BigInt(10),
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
      ]);
    },
  );
});
