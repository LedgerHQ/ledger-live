import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import BigNumber from "bignumber.js";
// eslint-disable-next-line no-restricted-imports
import { flatMap } from "lodash";
import { TonTransaction } from "../../bridge/bridgeHelpers/api.types";
import { mapTxToOps } from "../../bridge/bridgeHelpers/txn";
import { mockAccountId, mockAddress, tonTransactionResponse } from "../fixtures/common.fixtures";

describe("Transaction functions", () => {
  describe("mapTxToOps", () => {
    it("should map an IN ton transaction without total_fees to a ledger operation", async () => {
      const { now, lt, hash, in_msg, total_fees, mc_block_seqno } =
        tonTransactionResponse.transactions[0];

      const finalOperation = flatMap(
        tonTransactionResponse.transactions,
        mapTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      expect(finalOperation).toEqual([
        {
          accountId: mockAccountId,
          blockHash: null,
          blockHeight: mc_block_seqno,
          date: new Date(now * 1000), // now is defined in seconds
          extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
          fee: BigNumber(total_fees),
          hasFailed: false,
          hash: in_msg?.hash,
          id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "IN"),
          recipients: [in_msg?.destination],
          senders: ["EQCVnqqL0OOiZi2BQnjVGm-ZeUYgfUhHgAi-vn9F8-94HwrH"],
          type: "IN",
          value: BigNumber(in_msg?.value ?? 0),
        },
      ]);
    });

    it("should map an IN ton transaction with total_fees to a ledger operation", async () => {
      const transactions = [{ ...tonTransactionResponse.transactions[0], total_fees: "15" }];
      const { now, lt, hash, in_msg, total_fees, mc_block_seqno, account } = transactions[0];

      const finalOperation = flatMap(
        transactions,
        mapTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      expect(finalOperation).toEqual([
        {
          id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "NONE"),
          hash: in_msg?.hash,
          type: "NONE",
          value: BigNumber(total_fees),
          fee: BigNumber(0),
          blockHash: null,
          blockHeight: mc_block_seqno,
          hasFailed: false,
          accountId: mockAccountId,
          senders: [account],
          recipients: [],
          date: new Date(now * 1000), // now is defined in seconds
          extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
        },
        {
          accountId: mockAccountId,
          blockHash: null,
          blockHeight: mc_block_seqno,
          date: new Date(now * 1000), // now is defined in seconds
          extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
          fee: BigNumber(total_fees),
          hasFailed: false,
          hash: in_msg?.hash,
          id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "IN"),
          recipients: [in_msg?.destination],
          senders: ["EQCVnqqL0OOiZi2BQnjVGm-ZeUYgfUhHgAi-vn9F8-94HwrH"],
          type: "IN",
          value: BigNumber(in_msg?.value ?? 0),
        },
      ]);
    });

    it("should map an OUT ton transaction to a ledger operation", async () => {
      // The IN transaction will be used as OUT transaction and it will be adjusted
      const transactions: TonTransaction[] = [
        {
          ...tonTransactionResponse.transactions[0],
          in_msg: null,
        },
      ];
      if (tonTransactionResponse.transactions[0].in_msg) {
        transactions[0].out_msgs = [
          { ...tonTransactionResponse.transactions[0].in_msg, source: transactions[0].account },
        ];
      }
      const { now, lt, hash, out_msgs, total_fees, mc_block_seqno, account } = transactions[0];

      const finalOperation = flatMap(
        transactions,
        mapTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      expect(finalOperation).toEqual([
        {
          id: encodeOperationId(mockAccountId, hash ?? "", "OUT"),
          hash: out_msgs?.[0].hash,
          type: "OUT",
          value: BigNumber(out_msgs[0].value ?? 0).plus(BigNumber(total_fees)),
          fee: BigNumber(total_fees),
          blockHeight: mc_block_seqno,
          blockHash: null,
          hasFailed: false,
          accountId: mockAccountId,
          senders: [account],
          recipients: ["EQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbJfg"],
          date: new Date(now * 1000), // now is defined in seconds
          extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
        },
      ]);
    });
  });
});
