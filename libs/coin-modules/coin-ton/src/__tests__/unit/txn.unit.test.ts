import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import BigNumber from "bignumber.js";
// eslint-disable-next-line no-restricted-imports
import { flatMap } from "lodash";
import { TonJettonTransfer, TonTransaction } from "../../bridge/bridgeHelpers/api.types";
import { mapJettonTxToOps, mapTxToOps } from "../../bridge/bridgeHelpers/txn";
import {
  jettonTransferResponse,
  mockAccountId,
  mockAddress,
  tonTransactionResponse,
} from "../fixtures/common.fixtures";

describe("Transaction functions", () => {
  describe("mapTxToOps", () => {
    it.skip("should map an IN ton transaction without total_fees to a ledger operation", async () => {
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

    it.skip("should map an IN ton transaction with total_fees to a ledger operation", async () => {
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

    it.skip("should map an OUT ton transaction to a ledger operation", async () => {
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

  describe("mapJettonToOps", () => {
    it("should map an IN ton transaction without total_fees to a ledger operation", async () => {
      const { transaction_hash, amount, transaction_now, transaction_lt } =
        jettonTransferResponse.jetton_transfers[0];

      const finalOperation = flatMap(
        jettonTransferResponse.jetton_transfers,
        mapJettonTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      const tokenByCurrencyAddress = `${mockAccountId}+ton%2Fjetton%2Feqbynbo23ywhy~!underscore!~cgary9nk9ftz0ydsg82ptcbstqggoxwiua`;
      expect(finalOperation).toEqual([
        {
          id: encodeOperationId(tokenByCurrencyAddress, transaction_hash, "IN"),
          hash: transaction_hash,
          type: "IN",
          value: BigNumber(amount),
          fee: BigNumber(0),
          blockHeight: 1,
          blockHash: null,
          hasFailed: false,
          accountId: tokenByCurrencyAddress,
          senders: ["EQDnqcVSV4S9m2Y9gLAQrDerQktKSx2I1uhs6r5o_H8VT9G-"],
          recipients: [mockAddress],
          date: new Date(transaction_now * 1000), // now is defined in seconds
          extra: {
            comment: { isEncrypted: false, text: "" },
            explorerHash: transaction_hash,
            lt: transaction_lt,
          },
        },
      ]);
    });

    it("should map an OUT jetton transaction to a ledger operation", async () => {
      // The IN jetton transaction will be used as OUT transaction and it will be adjusted
      const jettonTransfers: TonJettonTransfer[] = [
        {
          ...jettonTransferResponse.jetton_transfers[0],
        },
      ];
      jettonTransfers[0].source = jettonTransfers[0].destination;
      jettonTransfers[0].destination = jettonTransferResponse.jetton_transfers[0].source;

      const { transaction_hash, amount, transaction_now, transaction_lt } = jettonTransfers[0];

      const finalOperation = flatMap(
        jettonTransfers,
        mapJettonTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      const tokenByCurrencyAddress = `${mockAccountId}+ton%2Fjetton%2Feqbynbo23ywhy~!underscore!~cgary9nk9ftz0ydsg82ptcbstqggoxwiua`;
      expect(finalOperation).toEqual([
        {
          id: encodeOperationId(tokenByCurrencyAddress, transaction_hash, "OUT"),
          hash: transaction_hash,
          type: "OUT",
          value: BigNumber(amount),
          fee: BigNumber(0),
          blockHeight: 1,
          blockHash: null,
          hasFailed: false,
          accountId: tokenByCurrencyAddress,
          recipients: ["EQDnqcVSV4S9m2Y9gLAQrDerQktKSx2I1uhs6r5o_H8VT9G-"],
          senders: [mockAddress],
          date: new Date(transaction_now * 1000), // now is defined in seconds
          extra: {
            comment: { isEncrypted: false, text: "" },
            explorerHash: transaction_hash,
            lt: transaction_lt,
          },
        },
      ]);
    });
  });
});
