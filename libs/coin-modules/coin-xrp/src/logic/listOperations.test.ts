import { listOperations } from "./listOperations";
import { RIPPLE_EPOCH } from "./utils";

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
      const delivered_amount = 100;
      const fee = 10;
      mockGetTransactions.mockResolvedValue([
        {
          meta: { delivered_amount: delivered_amount.toString() },
          tx: {
            Fee: fee.toString(),
            hash: "HASH_VALUE",
            inLedger: 1,
            date: 1000,
            Account: opSender,
            Destination: opDestination,
            Sequence: 1,
          },
        },
      ]);

      // When
      const results = await listOperations(address, 0);

      // Then
      expect(mockGetServerInfos).toHaveBeenCalledTimes(1);
      expect(mockGetTransactions).toHaveBeenCalledTimes(1);
      // if expectedType is "OUT", compute value with fees (i.e. delivered_amount + Fee)
      const expectedValue =
        expectedType === "IN" ? BigInt(delivered_amount) : BigInt(delivered_amount + fee);
      expect(results).toEqual([
        {
          hash: "HASH_VALUE",
          address,
          type: expectedType,
          value: expectedValue,
          fee: BigInt(10),
          blockHeight: 1,
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
        },
      ]);
    },
  );
});
