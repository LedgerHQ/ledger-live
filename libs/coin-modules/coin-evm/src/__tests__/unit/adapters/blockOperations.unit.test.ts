import type { TransactionEvent } from "@ledgerhq/coin-framework/api/index";
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
          const operations = rpcTransactionToBlockOperations(
            "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            1000000000000000000n,
            1000000n,
          );
          expect(operations).toEqual([
            {
              type: "TRANSFER",
              balanceDeltas: [
                {
                  address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                  peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                  asset: { type: "native" },
                  delta: -1000000000000000000n,
                },
                {
                  address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                  peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                  asset: { type: "native" },
                  delta: 1000000000000000000n,
                },
              ],
            },
            {
              type: "FEE",
              balanceDeltas: [
                {
                  address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                  asset: { type: "native" },
                  delta: -1000000n,
                },
              ],
            },
          ]);
        });

        it("should return only fee event for transaction with zero value", () => {
          const operations = rpcTransactionToBlockOperations(
            "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            0n,
            500000n,
          );

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "FEE",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: -500000n,
              },
            ],
          });
        });

        it("should handle transaction with undefined to address (contract creation)", () => {
          const operations = rpcTransactionToBlockOperations(
            "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            undefined,
            500000000000000000n,
            1000000n,
          );

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: undefined,
                asset: { type: "native" },
                delta: -500000000000000000n,
              },
            ],
          });
          expect(operations[1]).toEqual({
            type: "FEE",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: -1000000n,
              },
            ],
          });
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

        // Expected fee based on gas_used * gas_price: 51958 * 81876963401 = 4253317709034558n
        const expectedFee = BigInt(baseLedgerTx.gas_used) * BigInt(baseLedgerTx.gas_price);

        it("should extract native ETH transfer operations", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000", // 1 ETH
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: { type: "native" },
                delta: -1000000000000000000n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: 1000000000000000000n,
              },
            ],
          });
          expect(operations[1]).toEqual({
            type: "FEE",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: -expectedFee,
              },
            ],
          });
        });

        it("should return only fee event for transaction with zero value and no events", () => {
          const operations = ledgerTransactionToBlockOperations(baseLedgerTx);

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "FEE",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: -expectedFee,
              },
            ],
          });
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
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: {
                  type: "erc20",
                  assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
                delta: -1000000n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: {
                  type: "erc20",
                  assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
                delta: 1000000n,
              },
            ],
          });
          expect(operations[1].type).toBe("FEE");
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

          expect(operations).toHaveLength(3); // 2 TRANSFER events + 1 FEE event
          expect(operations[0].type).toBe("TRANSFER");
          expect(operations[0].balanceDeltas[0].asset).toEqual({
            type: "erc20",
            assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          });
          expect(operations[1].type).toBe("TRANSFER");
          expect(operations[1].balanceDeltas[0].asset).toEqual({
            type: "erc20",
            assetReference: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          });
          expect(operations[2].type).toBe("FEE");
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
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: {
                  type: "erc721",
                  assetReference: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                },
                delta: -1n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: {
                  type: "erc721",
                  assetReference: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                },
                delta: 1n,
              },
            ],
          });
          expect(operations[1].type).toBe("FEE");
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

          expect(operations).toHaveLength(3); // 2 TRANSFER events (one per transfer) + 1 FEE event
          expect(operations[0]).toEqual({
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: {
                  type: "erc1155",
                  assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
                },
                delta: -5n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: {
                  type: "erc1155",
                  assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
                },
                delta: 5n,
              },
            ],
          });
          expect(operations[1]).toEqual({
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: {
                  type: "erc1155",
                  assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
                },
                delta: -10n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: {
                  type: "erc1155",
                  assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
                },
                delta: 10n,
              },
            ],
          });
          expect(operations[2].type).toBe("FEE");
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
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                asset: { type: "native" },
                delta: -500000000000000000n,
              },
              {
                address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                asset: { type: "native" },
                delta: 500000000000000000n,
              },
            ],
          });
          expect(operations[1].type).toBe("FEE");
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

          expect(operations).toHaveLength(1);
          expect(operations[0].type).toBe("FEE");
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

          expect(operations).toHaveLength(1);
          expect(operations[0].type).toBe("FEE");
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

          // Native: 1 TRANSFER, ERC20: 1 TRANSFER, ERC721: 1 TRANSFER, ERC1155: 1 TRANSFER, Internal: 1 TRANSFER, FEE: 1 = 6 total
          expect(operations).toHaveLength(6);

          // Check TRANSFER events
          const transferOps = operations.filter(
            (op): op is TransactionEvent => op.type === "TRANSFER",
          );
          expect(transferOps).toHaveLength(5);

          // Check native transfers (from value and from actions)
          const nativeTransfers = transferOps.filter(op =>
            op.balanceDeltas.some(d => d.asset.type === "native"),
          );
          expect(nativeTransfers).toHaveLength(2);

          // Check ERC20 transfer
          const erc20Transfers = transferOps.filter(op =>
            op.balanceDeltas.some(d => d.asset.type === "erc20"),
          );
          expect(erc20Transfers).toHaveLength(1);

          // Check ERC721 transfer
          const erc721Transfers = transferOps.filter(op =>
            op.balanceDeltas.some(d => d.asset.type === "erc721"),
          );
          expect(erc721Transfers).toHaveLength(1);

          // Check ERC1155 transfer
          const erc1155Transfers = transferOps.filter(op =>
            op.balanceDeltas.some(d => d.asset.type === "erc1155"),
          );
          expect(erc1155Transfers).toHaveLength(1);

          // Check FEE event
          const feeOps = operations.filter((op): op is TransactionEvent => op.type === "FEE");
          expect(feeOps).toHaveLength(1);
        });

        it("should handle transaction with empty to address", () => {
          const ledgerTx: LedgerExplorerOperation = {
            ...baseLedgerTx,
            value: "1000000000000000000",
            to: "",
          };

          const operations = ledgerTransactionToBlockOperations(ledgerTx);

          expect(operations).toHaveLength(2);
          expect(operations[0]).toEqual({
            type: "TRANSFER",
            balanceDeltas: [
              {
                address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                peer: undefined,
                asset: { type: "native" },
                delta: -1000000000000000000n,
              },
            ],
          });
          expect(operations[1].type).toBe("FEE");
        });
      });
    });
  });
});
