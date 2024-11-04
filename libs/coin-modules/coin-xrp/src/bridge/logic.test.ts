import BigNumber from "bignumber.js";
import { filterOperations } from "./logic";
import { XrplOperation } from "../network/types";
import { RIPPLE_EPOCH } from "../logic";

describe("filterOperations", () => {
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
    "returns Transactions object with empty extra and ignore non necessary fields",
    ({ address, opSender, opDestination, expectedType }) => {
      // Given
      const deliveredAmount = 100;
      const fee = 10;
      const hash = "HASH_VALUE";
      const ops = [
        {
          meta: { delivered_amount: deliveredAmount.toString() },
          tx: {
            TransactionType: "Payment",
            Fee: fee.toString(),
            hash,
            inLedger: 1,
            date: 1000,
            Account: opSender,
            Destination: opDestination,
            DestinationTag: 509555,
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
        } as XrplOperation,
      ];

      // When
      const accountId = "ACCOUNT_ID";
      const txs = filterOperations(ops, accountId, address);

      // Then
      // if expectedType is "OUT", compute value with fees (i.e. delivered_amount + Fee)
      const expectedValue =
        expectedType === "IN"
          ? new BigNumber(deliveredAmount)
          : BigNumber(deliveredAmount).plus(fee);
      expect(txs).toEqual([
        {
          id: `ACCOUNT_ID-HASH_VALUE-${expectedType}`,
          hash,
          accountId,
          type: expectedType,
          value: expectedValue,
          fee: new BigNumber(fee),
          blockHash: null,
          blockHeight: 1,
          senders: [opSender],
          recipients: [opDestination],
          date: new Date(1000000 + RIPPLE_EPOCH * 1000),
          transactionSequenceNumber: 1,
          extra: {},
        },
      ]);
    },
  );
});
