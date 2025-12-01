import type { BlockOperation } from "@ledgerhq/coin-framework/api/index";
import {
  ledgerTransactionToBlockOperations,
  rpcTransactionToBlockOperations,
} from "../../../adapters/blockOperations";
import {
  LedgerExplorerOperation,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerInternalTransaction,
} from "../../../types";

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("blockOperations", () => {
      describe("rpcTransactionToBlockOperations", () => {
        it("should extract native ETH transfer operations from RPC transaction with value", () => {
          const tx = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            value: 1000000000000000000n, // 1 ETH
          };

          const operations = rpcTransactionToBlockOperations(tx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "native" },
            amount: -1000000000000000000n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: 1000000000000000000n,
          });
        });

        it("should return empty array for transaction with zero value", () => {
          const tx = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            value: 0n,
          };

          const operations = rpcTransactionToBlockOperations(tx);

          expect(operations).toHaveLength(0);
        });

        it("should handle transaction with null to address (contract creation)", () => {
          const tx = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: null,
            value: 500000000000000000n, // 0.5 ETH
          };

          const operations = rpcTransactionToBlockOperations(tx);

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: -500000000000000000n,
          });
          expect(operations[0]).not.toHaveProperty("peer");
        });

        it("should handle transaction with null from address", () => {
          const tx = {
            from: null,
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            value: 2000000000000000000n, // 2 ETH
          };

          const operations = rpcTransactionToBlockOperations(tx);

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "native" },
            amount: 2000000000000000000n,
          });
          expect(operations[0]).not.toHaveProperty("peer");
        });

        it("should handle invalid addresses gracefully", () => {
          const tx = {
            from: "0x0",
            to: "0x",
            value: 1000000000000000000n,
          };

          const operations = rpcTransactionToBlockOperations(tx);

          expect(operations).toHaveLength(0);
        });
      });

      describe("ledgerTransactionToBlockOperations", () => {
        const baseLedgerTx: LedgerExplorerOperation = {
          hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
          transaction_type: 2,
          nonce: "0x4b",
          nonce_value: 75,
          value: "0",
          gas: "62350",
          gas_price: "81876963401",
          max_fee_per_gas: "125263305914",
          max_priority_fee_per_gas: "33000000000",
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
          transfer_events: [],
          erc721_transfer_events: [],
          erc1155_transfer_events: [],
          approval_events: [],
          actions: [],
          confirmations: 5968364,
          input: null,
          gas_used: "51958",
          cumulative_gas_used: "16087064",
          status: 1,
          received_at: "2023-01-24T17:11:45Z",
          block: {
            hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            height: 38476740,
            time: "2023-01-24T17:11:45Z",
          },
        };

        it("should extract native ETH transfer operations", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000", // 1 ETH
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "native" },
            amount: -1000000000000000000n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: 1000000000000000000n,
          });
        });

        it("should return empty array for transaction with zero value and no events", () => {
          const operations = ledgerTransactionToBlockOperations(baseLedgerTx);

          expect(operations).toHaveLength(0);
        });

        it("should extract ERC20 token transfer operations", () => {
          const erc20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            count: "1000000", // 1 USDC (6 decimals)
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            transfer_events: [erc20Event],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
            amount: -1000000n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
            amount: 1000000n,
          });
        });

        it("should extract multiple ERC20 token transfer operations", () => {
          const erc20Events: LedgerExplorerERC20TransferEvent[] = [
            {
              contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
              to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
              count: "1000000",
            },
            {
              contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
              from: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
              to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
              count: "2000000",
            },
          ];

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            transfer_events: erc20Events,
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(4);
          expect(operations[0].asset).toEqual({
            type: "erc20",
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          });
          expect(operations[2].asset).toEqual({
            type: "erc20",
            assetReference: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          });
        });

        it("should extract ERC721 NFT transfer operations", () => {
          const erc721Event: LedgerExplorerER721TransferEvent = {
            contract: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            token_id: "1234",
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            erc721_transfer_events: [erc721Event],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "erc721", assetReference: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
            amount: -1n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "erc721", assetReference: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
            amount: 1n,
          });
        });

        it("should extract ERC1155 NFT transfer operations", () => {
          const erc1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0xed5af388653567af2f388e6224dc7c4b3241c544",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            operator: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            transfers: [
              { id: "1", value: "5" },
              { id: "2", value: "10" },
            ],
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            erc1155_transfer_events: [erc1155Event],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(4); // 2 transfers × 2 addresses
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "erc1155", assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544" },
            amount: -5n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "erc1155", assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544" },
            amount: 5n,
          });
          expect(operations[2].amount).toBe(-10n);
          expect(operations[3].amount).toBe(10n);
        });

        it("should extract internal transaction operations", () => {
          const internalTx: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            input: null,
            value: "500000000000000000", // 0.5 ETH
            gas: "21000",
            gas_used: "21000",
            error: null,
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            actions: [internalTx],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            asset: { type: "native" },
            amount: -500000000000000000n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: 500000000000000000n,
          });
        });

        it("should skip internal transactions with errors", () => {
          const internalTx: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            input: null,
            value: "500000000000000000",
            gas: "21000",
            gas_used: "21000",
            error: "revert",
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            actions: [internalTx],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(0);
        });

        it("should skip internal transactions with zero value", () => {
          const internalTx: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            input: null,
            value: "0",
            gas: "21000",
            gas_used: "21000",
            error: null,
          };

          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            actions: [internalTx],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(0);
        });

        it("should extract all operation types from a complex transaction", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000", // 1 ETH native transfer
            transfer_events: [
              {
                contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                count: "1000000",
              },
            ],
            erc721_transfer_events: [
              {
                contract: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
                sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                receiver: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                token_id: "1234",
              },
            ],
            erc1155_transfer_events: [
              {
                contract: "0xed5af388653567af2f388e6224dc7c4b3241c544",
                sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                operator: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                receiver: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                transfers: [{ id: "1", value: "5" }],
              },
            ],
            actions: [
              {
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                input: null,
                value: "500000000000000000",
                gas: "21000",
                gas_used: "21000",
                error: null,
              },
            ],
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          // Native: 2, ERC20: 2, ERC721: 2, ERC1155: 2, Internal: 2 = 10 total
          expect(operations).toHaveLength(10);

          // Check native transfer
          const nativeOps = operations.filter(
            (op): op is BlockOperation => op.type === "transfer" && op.asset.type === "native",
          );
          expect(nativeOps).toHaveLength(4); // 2 from value, 2 from actions

          // Check ERC20 transfer
          const erc20Ops = operations.filter(
            (op): op is BlockOperation => op.type === "transfer" && op.asset.type === "erc20",
          );
          expect(erc20Ops).toHaveLength(2);

          // Check ERC721 transfer
          const erc721Ops = operations.filter(
            (op): op is BlockOperation => op.type === "transfer" && op.asset.type === "erc721",
          );
          expect(erc721Ops).toHaveLength(2);

          // Check ERC1155 transfer
          const erc1155Ops = operations.filter(
            (op): op is BlockOperation => op.type === "transfer" && op.asset.type === "erc1155",
          );
          expect(erc1155Ops).toHaveLength(2);
        });

        it("should handle transaction with empty to address", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000",
            to: "",
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: -1000000000000000000n,
          });
          expect(operations[0]).not.toHaveProperty("peer");
        });

        it("should handle invalid addresses gracefully", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000",
            from: "0x0",
            to: "0x",
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(0);
        });
      });
    });
  });
});

