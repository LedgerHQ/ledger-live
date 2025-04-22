import { TransactionResponse } from "./api.types";
import {
  extractTokenTransferTransactions,
  extractSendManyTransactions,
  extractContractTransactions,
} from "./transformers";

describe("Stacks API Transformers", () => {
  const mockTransactions: TransactionResponse[] = [
    {
      tx: {
        tx_id: "0xabc123",
        tx_type: "token_transfer",
        // Other token transfer specific fields
      },
    },
    {
      tx: {
        tx_id: "0xdef456",
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP123.TOKEN-A",
          function_name: "send-many",
        },
      },
    },
    {
      tx: {
        tx_id: "0xghi789",
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP456.TOKEN-B",
          function_name: "transfer",
        },
        post_conditions: [
          {
            type: "fungible",
            asset: {
              asset_name: "TOKEN-B",
            },
          },
        ],
      },
    },
    {
      tx: {
        tx_id: "0xjkl012",
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP789.TOKEN-C",
          function_name: "transfer",
        },
        post_conditions: [
          {
            type: "fungible",
            asset: {
              asset_name: "TOKEN-C",
            },
          },
        ],
      },
    },
    {
      tx: {
        tx_id: "0xmno345",
        tx_type: "smart_contract",
        // Other smart contract specific fields
      },
    },
    {
      tx: {
        tx_id: "0xpqr678",
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP456.TOKEN-B",
          function_name: "other-function",
        },
      },
    },
    {
      tx: {
        tx_id: "0xstu901",
        tx_type: "contract_call",
        contract_call: {
          contract_id: "SP456.TOKEN-B",
          function_name: "transfer",
        },
        // Missing post_conditions
      },
    },
    {
      tx: {
        tx_id: "0xvwx234",
        tx_type: "contract_call",
        contract_call: {
          // Missing contract_id
          function_name: "transfer",
        },
        post_conditions: [
          {
            type: "fungible",
            asset: {
              asset_name: "TOKEN-D",
            },
          },
        ],
      },
    },
  ] as TransactionResponse[];

  describe("extractTokenTransferTransactions", () => {
    it("should extract only token transfer transactions", () => {
      const result = extractTokenTransferTransactions(mockTransactions);

      expect(result).toHaveLength(1);
      expect(result[0].tx?.tx_id).toEqual("0xabc123");
      expect(result[0].tx?.tx_type).toEqual("token_transfer");
    });

    it("should return empty array when no token transfers exist", () => {
      const noTokenTransfers = mockTransactions.filter(tx => tx.tx?.tx_type !== "token_transfer");
      const result = extractTokenTransferTransactions(noTokenTransfers);

      expect(result).toHaveLength(0);
    });
  });

  describe("extractSendManyTransactions", () => {
    it("should extract only send-many transactions", () => {
      const result = extractSendManyTransactions(mockTransactions);

      expect(result).toHaveLength(1);
      expect(result[0].tx?.tx_id).toEqual("0xdef456");
      expect(result[0].tx?.tx_type).toEqual("contract_call");
      expect(result[0].tx?.contract_call?.function_name).toEqual("send-many");
    });

    it("should return empty array when no send-many transactions exist", () => {
      const noSendManyTxs = mockTransactions.filter(
        tx =>
          !(
            tx.tx?.tx_type === "contract_call" &&
            tx.tx?.contract_call?.function_name === "send-many"
          ),
      );
      const result = extractSendManyTransactions(noSendManyTxs);

      expect(result).toHaveLength(0);
    });
  });

  describe("extractContractTransactions", () => {
    it("should extract and group transfer transactions by token ID", () => {
      const result = extractContractTransactions(mockTransactions);

      // We expect two tokens with transfer function
      expect(Object.keys(result)).toHaveLength(2);

      // Check SP456.TOKEN-B::TOKEN-B
      expect(result["SP456.TOKEN-B::TOKEN-B"]).toBeDefined();
      expect(result["SP456.TOKEN-B::TOKEN-B"]).toHaveLength(1);
      expect(result["SP456.TOKEN-B::TOKEN-B"][0].tx?.tx_id).toEqual("0xghi789");

      // Check SP789.TOKEN-C::TOKEN-C
      expect(result["SP789.TOKEN-C::TOKEN-C"]).toBeDefined();
      expect(result["SP789.TOKEN-C::TOKEN-C"]).toHaveLength(1);
      expect(result["SP789.TOKEN-C::TOKEN-C"][0].tx?.tx_id).toEqual("0xjkl012");
    });

    it("should exclude non-contract calls", () => {
      const result = extractContractTransactions(mockTransactions);

      // Make sure token_transfer and smart_contract are excluded
      const allTxIds = Object.values(result)
        .flat()
        .map(tx => tx.tx?.tx_id);
      expect(allTxIds).not.toContain("0xabc123"); // token_transfer
      expect(allTxIds).not.toContain("0xmno345"); // smart_contract
    });

    it("should exclude send-many transactions", () => {
      const result = extractContractTransactions(mockTransactions);

      const allTxIds = Object.values(result)
        .flat()
        .map(tx => tx.tx?.tx_id);
      expect(allTxIds).not.toContain("0xdef456"); // send-many
    });

    it("should exclude non-transfer function calls", () => {
      const result = extractContractTransactions(mockTransactions);

      const allTxIds = Object.values(result)
        .flat()
        .map(tx => tx.tx?.tx_id);
      expect(allTxIds).not.toContain("0xpqr678"); // other-function
    });

    it("should handle missing post_conditions", () => {
      const result = extractContractTransactions(mockTransactions);

      const allTxIds = Object.values(result)
        .flat()
        .map(tx => tx.tx?.tx_id);
      expect(allTxIds).not.toContain("0xstu901"); // Missing post_conditions
    });

    it("should handle missing contract_id", () => {
      const result = extractContractTransactions(mockTransactions);

      const allTxIds = Object.values(result)
        .flat()
        .map(tx => tx.tx?.tx_id);
      expect(allTxIds).not.toContain("0xvwx234"); // Missing contract_id
    });

    it("should return empty object when no valid contract transactions exist", () => {
      const noContractTxs = mockTransactions.filter(tx => tx.tx?.tx_type !== "contract_call");
      const result = extractContractTransactions(noContractTxs);

      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});
