import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { Builder, Slice } from "@ton/core";
import BigNumber from "bignumber.js";
// eslint-disable-next-line no-restricted-imports
import flatMap from "lodash/flatMap";
import { TonJettonTransfer, TonTransaction } from "../../bridge/bridgeHelpers/api.types";
import {
  dataToSlice,
  decodeForwardPayload,
  loadSnakeBytes,
  mapJettonTxToOps,
  mapTxToOps,
} from "../../bridge/bridgeHelpers/txn";
import {
  jettonTransferResponse,
  mockAccountId,
  mockAddress,
  tonTransactionResponse,
} from "../fixtures/common.fixtures";

setupMockCryptoAssetsStore();

describe("Transaction functions", () => {
  describe("mapTxToOps", () => {
    it("should map an IN failed ton transaction without total_fees to a ledger operation", async () => {
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
          hasFailed: true,
          hash: in_msg?.hash,
          id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "IN"),
          recipients: [in_msg?.destination],
          senders: ["EQCVnqqL0OOiZi2BQnjVGm-ZeUYgfUhHgAi-vn9F8-94HwrH"],
          type: "IN",
          value: BigNumber(in_msg?.value ?? 0),
          subOperations: undefined,
        },
      ]);
    });

    it("should map an IN ton transaction with total_fees to a ledger operation", async () => {
      const transactions = [{ ...tonTransactionResponse.transactions[0], total_fees: "15" }];
      const { now, lt, hash, in_msg, total_fees, mc_block_seqno } = transactions[0];

      const finalOperation = flatMap(
        transactions,
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
          hasFailed: true,
          hash: in_msg?.hash,
          id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "IN"),
          recipients: [in_msg?.destination],
          senders: ["EQCVnqqL0OOiZi2BQnjVGm-ZeUYgfUhHgAi-vn9F8-94HwrH"],
          type: "IN",
          value: BigNumber(in_msg?.value ?? 0),
          subOperations: [
            {
              id: encodeOperationId(mockAccountId, in_msg?.hash ?? "", "NONE"),
              hash: in_msg?.hash,
              type: "NONE",
              value: BigNumber(total_fees),
              fee: BigNumber(0),
              blockHeight: mc_block_seqno,
              blockHash: null,
              hasFailed: true,
              accountId: mockAccountId,
              senders: [mockAddress],
              recipients: [],
              date: new Date(now * 1000),
              extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
            },
          ],
        },
      ]);
    });

    it("should map a failed OUT ton transaction to a ledger operation", async () => {
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
      const { now, lt, hash, out_msgs, total_fees, mc_block_seqno } = transactions[0];

      const finalOperation = flatMap(
        transactions,
        mapTxToOps(mockAccountId, mockAddress, tonTransactionResponse.address_book),
      );

      expect(finalOperation).toEqual([
        {
          id: encodeOperationId(mockAccountId, hash, "OUT"),
          hash: out_msgs?.[0].hash,
          type: "OUT",
          value: BigNumber(out_msgs?.[0].value ?? 0),
          fee: BigNumber(total_fees),
          blockHeight: mc_block_seqno,
          blockHash: null,
          hasFailed: true,
          accountId: mockAccountId,
          senders: [transactions[0].account],
          recipients: ["EQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbJfg"],
          date: new Date(now * 1000), // now is defined in seconds
          extra: { comment: { isEncrypted: false, text: "" }, explorerHash: hash, lt },
        },
      ]);
    });
  });

  describe("mapJettonToOps", () => {
    beforeEach(() => {
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: async (address: string, _currencyId: string) => {
          // The address is converted to lowercase in mapJettonTxToOps
          // jetton_master from fixtures: "0:2F956143C461769579BAEF2E32CC2D7BC18283F40D20BB03E432CD603AC33FFC"
          // Converted to friendly format and lowercased
          if (
            address === "eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not" ||
            address.includes("2f956143c461769579baef2e32cc2d7bc18283f40d20bb03e432cd603ac33ffc")
          ) {
            return {
              id: "ton/jetton/eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not",
              type: "TokenCurrency" as const,
              contractAddress: "EQAVLwfDxGF2LXm67Y4yzC17WYkd9A0gUWPkMS1gOsM__NOT",
              parentCurrency: getCryptoCurrencyById("ton"),
              tokenType: "jetton",
              name: "NOT",
              ticker: "NOT",
              units: [
                {
                  name: "NOT",
                  code: "NOT",
                  magnitude: 9,
                },
              ],
            };
          }
          return undefined;
        },
        getTokensSyncHash: async () => "0",
      });
    });

    it("should map an IN ton transaction without total_fees to a ledger operation", async () => {
      const { transaction_hash, amount, transaction_now, transaction_lt } =
        jettonTransferResponse.jetton_transfers[0];

      const jettonOpsMapper = mapJettonTxToOps(
        mockAccountId,
        mockAddress,
        tonTransactionResponse.address_book,
      );
      const finalOperation = (
        await Promise.all(jettonTransferResponse.jetton_transfers.map(jettonOpsMapper))
      ).flat();

      const tokenByCurrencyAddress = `${mockAccountId}+ton%2Fjetton%2Feqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm~!underscore!~~!underscore!~not`;
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

      const jettonOpsMapper = mapJettonTxToOps(
        mockAccountId,
        mockAddress,
        tonTransactionResponse.address_book,
      );
      const finalOperation = (await Promise.all(jettonTransfers.map(jettonOpsMapper))).flat();

      const tokenByCurrencyAddress = `${mockAccountId}+ton%2Fjetton%2Feqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm~!underscore!~~!underscore!~not`;
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

describe("TON Payload Processing Functions", () => {
  describe("dataToSlice", () => {
    it("should convert base64 string to Slice when it's a valid BOC", () => {
      // Create a Cell from a string and convert to BOC
      const cell = new Builder().storeUint(123, 32).endCell();
      const bocBase64 = cell.toBoc().toString("base64");

      const result = dataToSlice(bocBase64);

      expect(result).toBeInstanceOf(Slice);
      expect(result?.loadUint(32)).toBe(123);
    });

    it("should fallback to BitString when the data is not a valid BOC", () => {
      const invalidBocBase64 = "aW52YWxpZCB0b24gZGF0YQ=="; // "invalid ton data"

      const result = dataToSlice(invalidBocBase64);

      expect(result).toBeInstanceOf(Slice);
    });

    it("should return undefined for non-string input", () => {
      // @ts-expect-error - Testing invalid input
      const result = dataToSlice(null);

      expect(result).toBeUndefined();
    });
  });

  describe("loadSnakeBytes", () => {
    it("should load bytes from a simple slice without refs", () => {
      const cell = new Builder().storeBuffer(Buffer.from("Slice", "utf-8")).endCell();
      const slice = cell.beginParse();

      const result = loadSnakeBytes(slice);

      expect(result.toString("utf-8")).toBe("Slice");
    });

    it("should load bytes from a slice with refs (snake structure)", () => {
      // Create a chain of cells (snake structure)
      const cell2 = new Builder().storeBuffer(Buffer.from(" Data", "utf-8")).endCell();
      const cell1 = new Builder()
        .storeBuffer(Buffer.from("Slice", "utf-8"))
        .storeRef(cell2)
        .endCell();

      const slice = cell1.beginParse();

      const result = loadSnakeBytes(slice);

      expect(result.toString("utf-8")).toBe("Slice Data");
    });

    it("should handle empty slice", () => {
      const cell = new Builder().endCell();
      const slice = cell.beginParse();

      const result = loadSnakeBytes(slice);

      expect(result.length).toBe(0);
    });

    it("should handle slice with multiple refs in chain", () => {
      // Create a longer chain of cells (snake structure)
      const cell3 = new Builder().storeBuffer(Buffer.from("Part3", "utf-8")).endCell();
      const cell2 = new Builder()
        .storeBuffer(Buffer.from("Part2", "utf-8"))
        .storeRef(cell3)
        .endCell();
      const cell1 = new Builder()
        .storeBuffer(Buffer.from("Part1", "utf-8"))
        .storeRef(cell2)
        .endCell();

      const slice = cell1.beginParse();

      const result = loadSnakeBytes(slice);

      expect(result.toString("utf-8")).toBe("Part1Part2Part3");
    });
  });

  describe("decodeForwardPayload", () => {
    it("should return empty string for null payload", () => {
      const result = decodeForwardPayload(null);

      expect(result).toBe("");
    });

    it("should decode a valid payload with opcode 0 containing text", () => {
      // Create a cell with opcode 0 followed by a text string
      const cell = new Builder()
        .storeUint(0, 32) // opcode 0
        .storeBuffer(Buffer.from("This is the comment", "utf-8"))
        .endCell();
      const bocBase64 = cell.toBoc().toString("base64");

      const result = decodeForwardPayload(bocBase64);

      expect(result).toBe("This is the comment");
    });

    it("should return empty string for payloads with non-zero opcode", () => {
      // Create a cell with opcode 1 followed by some data
      const cell = new Builder()
        .storeUint(1, 32) // non-zero opcode
        .storeBuffer(Buffer.from("Should be ignored", "utf-8"))
        .endCell();
      const bocBase64 = cell.toBoc().toString("base64");

      const result = decodeForwardPayload(bocBase64);

      expect(result).toBe("");
    });

    it("should handle payload with unicode characters", () => {
      // Create a cell with opcode 0 followed by a text with unicode
      const cell = new Builder()
        .storeUint(0, 32) // opcode 0
        .storeBuffer(Buffer.from("Unicode: 你好, мир, 🚀", "utf-8"))
        .endCell();
      const bocBase64 = cell.toBoc().toString("base64");

      const result = decodeForwardPayload(bocBase64);

      expect(result).toBe("Unicode: 你好, мир, 🚀");
    });

    it("should handle snake format payloads correctly", () => {
      // Create a chain of cells with opcode 0 followed by a long message
      const cell2 = new Builder()
        .storeBuffer(Buffer.from(" would need multiple cells to store.", "utf-8"))
        .endCell();
      const cell1 = new Builder()
        .storeUint(0, 32) // opcode 0
        .storeBuffer(Buffer.from("This is a very long message that", "utf-8"))
        .storeRef(cell2)
        .endCell();

      const bocBase64 = cell1.toBoc().toString("base64");

      const result = decodeForwardPayload(bocBase64);

      expect(result).toBe("This is a very long message that would need multiple cells to store.");
    });

    it("should handle invalid payloads gracefully by returning empty string", () => {
      // Create an invalid base64 string
      const invalidBase64 = "!@#$%^&*()";

      const result = decodeForwardPayload(invalidBase64);

      expect(result).toBe("");
    });

    it("should handle valid base64 but invalid BOC payloads", () => {
      // Valid base64 but not a valid BOC
      const validBase64NotBoc = "aW52YWxpZCB0b24gZGF0YQ=="; // "invalid ton data" in base64

      const result = decodeForwardPayload(validBase64NotBoc);

      // Should return empty string as it's not a valid Cell
      expect(result).toBe("");
    });
  });
});
