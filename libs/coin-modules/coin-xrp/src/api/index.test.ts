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
      mockGetTransactions.mockResolvedValue([
        {
          meta: { delivered_amount: deliveredAmount.toString() },
          tx: {
            TransactionType: "Payment",
            Fee: fee.toString(),
            hash: "HASH_VALUE",
            inLedger: 1,
            date: 1000,
            Account: opSender,
            Destination: opDestination,
            Sequence: 1,
          },
        },
        {
          meta: { delivered_amount: deliveredAmount.toString() },
          tx: {
            TransactionType: "Payment",
            Fee: fee.toString(),
            hash: "HASH_VALUE",
            inLedger: 1,
            date: 1000,
            Account: opSender,
            Destination: opDestination,
            DestinationTag: 509555,
            Sequence: 1,
          },
        },
        {
          meta: { delivered_amount: deliveredAmount.toString() },
          tx: {
            TransactionType: "Payment",
            Fee: fee.toString(),
            hash: "HASH_VALUE",
            inLedger: 1,
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
      const results = await api.listOperations(address, 0);

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
          value: expectedValue,
          fee: BigInt(10),
          blockHeight: 1,
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
          blockHeight: 1,
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
          blockHeight: 1,
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
