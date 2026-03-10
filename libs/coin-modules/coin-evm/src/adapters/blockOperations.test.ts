import type { BlockOperation } from "@ledgerhq/coin-framework/api/index";
import type {
  TraceBlockAction,
  TraceBlockItem,
  TraceBlockRewardAction,
} from "../network/node/types";
import {
  LedgerExplorerOperation,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerInternalTransaction,
} from "../types";
import {
  ledgerTransactionToBlockOperations,
  rpcTransactionToBlockOperations,
  traceBlockItemsToOperationsByHash,
} from "./blockOperations";

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("blockOperations", () => {
      describe("rpcTransactionToBlockOperations", () => {
        it("should extract native ETH transfer operations from transaction with value", () => {
          const operations = rpcTransactionToBlockOperations({
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "1000000000000000000",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            erc20Transfers: [],
          });
          expect(operations).toEqual([
            {
              type: "transfer",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              asset: { type: "native" },
              amount: -1000000000000000000n,
            },
            {
              type: "transfer",
              address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              asset: { type: "native" },
              amount: 1000000000000000000n,
            },
          ]);
        });

        it("should return empty array for transaction with zero value", () => {
          const operations = rpcTransactionToBlockOperations({
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "0",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            erc20Transfers: [],
          });

          expect(operations).toHaveLength(0);
        });

        it("should handle transaction with undefined to address (contract creation)", () => {
          const operations = rpcTransactionToBlockOperations({
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "500000000000000000",
            to: undefined,
            erc20Transfers: [],
          });

          expect(operations).toHaveLength(1);
          expect(operations[0]).toEqual({
            type: "transfer",
            address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: { type: "native" },
            amount: -500000000000000000n,
          });
          expect(operations[0]).not.toHaveProperty("peer");
        });

        it("should handle transaction with empty from address", () => {
          const operations = rpcTransactionToBlockOperations({
            from: "",
            value: "2000000000000000000",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            erc20Transfers: [],
          });

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
          const operations = rpcTransactionToBlockOperations({
            from: "0x0",
            value: "1000000000000000000",
            to: "0x",
            erc20Transfers: [],
          });

          expect(operations).toHaveLength(0);
        });

        it("should extract ERC20 transfers from erc20Transfers", () => {
          const operations = rpcTransactionToBlockOperations({
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            value: "0",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            erc20Transfers: [
              {
                asset: {
                  type: "erc20",
                  assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                },
                from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
                to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
                value: "1000000",
              },
            ],
          });

          expect(operations).toEqual([
            {
              type: "transfer",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              asset: {
                type: "erc20",
                assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              amount: -1000000n,
            },
            {
              type: "transfer",
              address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              asset: {
                type: "erc20",
                assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              },
              amount: 1000000n,
            },
          ]);
        });
      });

      describe("traceBlockItemsToOperationsByHash", () => {
        const makeAction = (overrides: Partial<TraceBlockAction>): TraceBlockAction => ({
          from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
          to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
          callType: "call",
          gas: "0x5208",
          input: "0x",
          value: "1000000000000000000",
          ...overrides,
        });

        const makeTraceItem = (
          overrides: Partial<TraceBlockItem> & { transactionHash: string },
        ): TraceBlockItem =>
          ({
            action: makeAction(overrides?.action || {}),
            result: { gasUsed: "0x5208", output: "0x" },
            blockHash: "0xabc",
            blockNumber: 1,
            transactionPosition: 0,
            traceAddress: [],
            subtraces: 0,
            type: "call",
            ...overrides,
          }) as TraceBlockItem;

        const makeRewardAction = (
          overrides: Partial<TraceBlockRewardAction> = {},
        ): TraceBlockRewardAction => ({
          author: "0x8f81e2e3f8b46467523463835f965ffe476e1c9e",
          rewardType: "block",
          value: "0x0",
          ...overrides,
        });

        const makeRewardTraceItem = (overrides: Partial<TraceBlockItem> = {}): TraceBlockItem =>
          ({
            action: makeRewardAction(),
            blockHash: "0x6c508acd5fb899025f59582d097b7d693e2efd538576d9709747272960e76663",
            blockNumber: 19500620,
            result: null,
            subtraces: 0,
            traceAddress: [],
            transactionHash: null,
            transactionPosition: null,
            type: "reward",
            ...overrides,
          }) as TraceBlockItem;

        it("should group native value transfers by transaction hash", () => {
          const items: TraceBlockItem[] = [
            makeTraceItem({ transactionHash: "0xhash1" }),
            makeTraceItem({
              transactionHash: "0xhash2",
              action: makeAction({ value: "500000000000000000" }),
            }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(2);
          expect(byHash.get("0xhash1")).toEqual([
            {
              type: "transfer",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              asset: { type: "native" },
              amount: -1000000000000000000n,
            },
            {
              type: "transfer",
              address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              asset: { type: "native" },
              amount: 1000000000000000000n,
            },
          ]);
          expect(byHash.get("0xhash2")).toEqual([
            {
              type: "transfer",
              address: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              peer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              asset: { type: "native" },
              amount: -500000000000000000n,
            },
            {
              type: "transfer",
              address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
              peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
              asset: { type: "native" },
              amount: 500000000000000000n,
            },
          ]);
        });

        it("should skip traces with result.error", () => {
          const items: TraceBlockItem[] = [
            makeTraceItem({
              transactionHash: "0xhash1",
              result: { gasUsed: "0x5208", output: "0x", error: "revert" },
            }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(0);
        });

        it("should skip traces with error = 'Reverted'", () => {
          const items: TraceBlockItem[] = [
            makeTraceItem({
              transactionHash: "0xhash1",
              error: "Reverted",
            }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(0);
        });

        it("should skip traces with zero value", () => {
          const items: TraceBlockItem[] = [
            makeTraceItem({
              transactionHash: "0xhash1",
              action: makeAction({ value: "0" }),
            }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(0);
        });

        it("should merge multiple traces for the same transaction hash", () => {
          const items: TraceBlockItem[] = [
            makeTraceItem({ transactionHash: "0xsame" }),
            makeTraceItem({
              transactionHash: "0xsame",
              action: makeAction({ value: "500000000000000000" }),
            }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(1);
          expect(byHash.get("0xsame")).toHaveLength(4);
        });

        it("should skip reward traces", () => {
          const items: TraceBlockItem[] = [makeRewardTraceItem()];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(0);
        });

        it("should include only call traces when mixed with reward traces", () => {
          const items: TraceBlockItem[] = [
            makeRewardTraceItem(),
            makeTraceItem({ transactionHash: "0xhash1" }),
          ];

          const byHash = traceBlockItemsToOperationsByHash(items);

          expect(byHash.size).toBe(1);
          expect(byHash.get("0xhash1")).toHaveLength(2);
        });

        it("should return empty map for empty input", () => {
          const byHash = traceBlockItemsToOperationsByHash([]);
          expect(byHash.size).toBe(0);
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
            asset: {
              type: "erc1155",
              assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
            },
            amount: -5n,
          });
          expect(operations[1]).toEqual({
            type: "transfer",
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            peer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            asset: {
              type: "erc1155",
              assetReference: "0xED5AF388653567Af2F388E6224dC7C4b3241C544",
            },
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
