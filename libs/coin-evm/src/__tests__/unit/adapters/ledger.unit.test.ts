import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import {
  ledgerERC1155EventToOperations,
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerInternalTransactionToOperations,
  ledgerOperationToOperations,
} from "../../../adapters";
import {
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerInternalTransaction,
  LedgerExplorerOperation,
} from "../../../types";

const accountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "ethereum",
  xpubOrAddress: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
  derivationMode: "",
});

const coinOperation: Operation = {
  id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-FEES",
  hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
  accountId,
  blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
  blockHeight: 38476740,
  recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
  senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
  value: new BigNumber("4254163264389158"),
  fee: new BigNumber("4254163264389158"),
  date: new Date("2023-01-24T17:11:45Z"),
  transactionSequenceNumber: 75,
  hasFailed: false,
  nftOperations: [],
  subOperations: [],
  type: "FEES",
  extra: {},
};

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("ledger", () => {
      describe("ledgerOperationToOperations", () => {
        it("should convert a ledger explorer smart contract creation operation (from their API) to a Ledger Live Operation", () => {
          const ledgerExplorerOp: LedgerExplorerOperation = {
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
            to: "",
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 5968364,
            input:
              "0xa9059cbb000000000000000000000000313143c4088a47c469d06fe3fa5fd4196be6a4d600000000000000000000000000000000000000000003b8e97d229a2d54800000",
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

          const accountId = encodeAccountId({
            type: "js",
            version: "2",
            currencyId: "ethereum",
            xpubOrAddress: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e",
            derivationMode: "",
          });

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x9aa99c23f67c81701c772b106b4f83f6e858dd2e:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NONE",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: [""],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("0"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "NONE",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerExplorerOp)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer smart contract operation to a Ledger Live Operation", () => {
          const ledgerOperation: LedgerExplorerOperation = {
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
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
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

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-FEES",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("4254163264389158"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "FEES",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin out operation to a Ledger Live Operation", () => {
          const ledgerOperation: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
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

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("4254163264389159"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "OUT",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin in operation to a Ledger Live Operation", () => {
          const ledgerOperation: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
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

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "IN",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin none operation to a Ledger Live Operation", () => {
          const ledgerOperation: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
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

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NONE",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            senders: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "NONE",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer legacy coin none operation (smart contract creation) to a Ledger Live Operation", () => {
          // This operation represents a smart contract creation
          // cf. https://polygonscan.com/tx/0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1
          // For some reason the explorer API returns a "to" address of "0x0"

          const ledgerOperation: LedgerExplorerOperation = {
            hash: "0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1",
            transaction_type: 0,
            nonce: "0x3",
            nonce_value: 3,
            value: "0",
            gas: "21356033",
            gas_price: "42392511388",
            // this is a legacy operation (transaction_type === 0), so we don't have max_fee_per_gas and max_priority_fee_per_gas
            max_fee_per_gas: null,
            max_priority_fee_per_gas: null,
            from: "0x787acf62ffc81bb171d1f46fb8b3fc6503d503e8",
            to: "0x0",
            transfer_events: [],
            erc721_transfer_events: [
              {
                contract: "0xe22eab38e8325ae03aeb53390c00a66eb0218c25",
                sender: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
                receiver: "0x84c9a36721eb21da9244fe50177180d8f4a7caf7",
                token_id: "63",
              },
            ],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 9822660,
            input: null,
            gas_used: "21356033",
            cumulative_gas_used: "24822433",
            status: 1,
            received_at: "2022-12-13T21:41:37Z",
            block: {
              hash: "0xcf0072dc5eb6e39ae5377b5323914f750da0cf5d2538f7d3ce7d8739c0624199",
              height: 36795782,
              time: "2022-12-13T21:41:37Z",
            },
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1-NONE",
            hash: "0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1",
            accountId,
            blockHash: "0xcf0072dc5eb6e39ae5377b5323914f750da0cf5d2538f7d3ce7d8739c0624199",
            blockHeight: 36795782,
            recipients: [""],
            senders: ["0x787aCF62fFC81Bb171d1f46fB8b3Fc6503D503e8"],
            value: new BigNumber("0"),
            fee: new BigNumber("905335872155003804"),
            date: new Date("2022-12-13T21:41:37Z"),
            transactionSequenceNumber: 3,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "NONE",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer self send coin operation to 2 Ledger Live Operations", () => {
          const ledgerOperation: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            transfer_events: [
              {
                contract: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
                to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
                count: "100000000000000",
              },
            ],
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

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "IN",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("4254163264389159"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            hasFailed: false,
            nftOperations: [],
            subOperations: [],
            internalOperations: [],
            type: "OUT",
            extra: {},
          };

          expect(ledgerOperationToOperations(accountId, ledgerOperation)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });
      });

      describe("ledgerERC20EventToOperations", () => {
        const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");

        it("should return an empty array for an unknown token", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0x000000000000000000000000000000000000dead",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            count: "100000000000000",
          };

          expect(ledgerERC20EventToOperations(coinOperation, ledgerERC20Event)).toEqual([]);
        });

        it("should convert a ledger explorer usdc out event to a Ledger Live Operation", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            count: "100000000000000",
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId: encodeTokenAccountId(accountId, tokenCurrency),
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            value: new BigNumber("100000000000000"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "OUT",
            extra: {},
          };

          expect(ledgerERC20EventToOperations(coinOperation, ledgerERC20Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a ledger explorer usdc in event to a Ledger Live Operation", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            count: "100000000000000",
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId: encodeTokenAccountId(accountId, tokenCurrency),
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            value: new BigNumber("100000000000000"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "IN",
            extra: {},
          };

          expect(ledgerERC20EventToOperations(coinOperation, ledgerERC20Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore a ledger explorer usdc none event and return empty array", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            count: "100000000000000",
          };

          expect(ledgerERC20EventToOperations(coinOperation, ledgerERC20Event)).toEqual([]);
        });

        it("should convert a ledger explorer self usdc event into 2 Ledger Live Operations", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            count: "100000000000000",
          };

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId: encodeTokenAccountId(accountId, tokenCurrency),
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            value: new BigNumber("100000000000000"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "IN",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+ethereum%2Ferc20%2Fusd~!underscore!~~!underscore!~coin-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId: encodeTokenAccountId(accountId, tokenCurrency),
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            value: new BigNumber("100000000000000"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "OUT",
            extra: {},
          };

          expect(ledgerERC20EventToOperations(coinOperation, ledgerERC20Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });
      });

      describe("ledgerERC721EventToOperations", () => {
        it("should convert a ledger explorer erc721 nft out event to a Ledger Live Operation", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A+49183440411075624253866807957299276245920874859439606792850319902048050479106+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
            standard: "ERC721",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };

          expect(ledgerERC721EventToOperations(coinOperation, ledgerERC721Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a ledger explorer erc721 nft in event to a Ledger Live Operation", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A+49183440411075624253866807957299276245920874859439606792850319902048050479106+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            contract: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
            standard: "ERC721",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };

          expect(ledgerERC721EventToOperations(coinOperation, ledgerERC721Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should ignore a ledger explorer erc721 nft none event and return empty array", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            receiver: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          expect(ledgerERC721EventToOperations(coinOperation, ledgerERC721Event)).toEqual([]);
        });

        it("should convert a ledger explorer erc721 nft event into 2 Ledger Live Operations", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A+49183440411075624253866807957299276245920874859439606792850319902048050479106+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
            standard: "ERC721",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A+49183440411075624253866807957299276245920874859439606792850319902048050479106+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
            standard: "ERC721",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };

          expect(ledgerERC721EventToOperations(coinOperation, ledgerERC721Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });
      });

      describe("ledgerERC1155EventToOperations", () => {
        it("should convert a ledger explorer erc721 nft out event to a Ledger Live Operation", () => {
          const ledgerERC1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            operator: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            transfers: [
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "1",
              },
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "2",
              },
            ],
          };

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_1",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("2"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };

          expect(ledgerERC1155EventToOperations(coinOperation, ledgerERC1155Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });

        it("should convert a ledger explorer erc721 nft in event to a Ledger Live Operation", () => {
          const ledgerERC1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
            sender: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            operator: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            transfers: [
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "1",
              },
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "2",
              },
            ],
          };

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0_0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0_1",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("2"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };

          expect(ledgerERC1155EventToOperations(coinOperation, ledgerERC1155Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });

        it("should ignore a ledger explorer erc721 nft none event and return empty array", () => {
          const ledgerERC1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
            sender: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            operator: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            receiver: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            transfers: [
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "1",
              },
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "2",
              },
            ],
          };

          expect(ledgerERC1155EventToOperations(coinOperation, ledgerERC1155Event)).toEqual([]);
        });

        it("should convert a ledger explorer erc721 nft event into 2 Ledger Live Operations", () => {
          const ledgerERC1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            operator: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            transfers: [
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "1",
              },
              {
                id: "49183440411075624253866807957299276245920874859439606792850319904247073734666",
                value: "2",
              },
            ],
          };

          const expectedOperation1: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0_0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };
          const expectedOperation2: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("1"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };
          const expectedOperation3: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_IN-i0_1",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("2"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_IN",
            extra: {},
          };
          const expectedOperation4: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:+0x2953399124F0cBB46d2CbACD8A89cF0599974963+49183440411075624253866807957299276245920874859439606792850319904247073734666+ethereum-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NFT_OUT-i0_1",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            contract: "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
            tokenId:
              "49183440411075624253866807957299276245920874859439606792850319904247073734666",
            standard: "ERC1155",
            value: new BigNumber("2"),
            fee: new BigNumber("4254163264389158"),
            date: new Date("2023-01-24T17:11:45Z"),
            transactionSequenceNumber: 75,
            type: "NFT_OUT",
            extra: {},
          };

          expect(ledgerERC1155EventToOperations(coinOperation, ledgerERC1155Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
            expectedOperation3,
            expectedOperation4,
          ]);
        });
      });

      describe("ledgerInternalTransactionToOperations", () => {
        it("should convert a ledger explorer out action to a Ledger Live Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x49048044D57e1C92A77f79988d21Fa8fAF74E97e"],
            value: new BigNumber("10000000000000000"),
            fee: new BigNumber("0"),
            date: new Date("2023-01-24T17:11:45Z"),
            type: "OUT",
            hasFailed: false,
            extra: {},
          };

          expect(ledgerInternalTransactionToOperations(coinOperation, ledgerAction)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a ledger explorer in action to a Ledger Live Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const expectedOperation: Operation = {
            id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN-i0",
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            accountId,
            blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
            blockHeight: 38476740,
            senders: ["0x49048044D57e1C92A77f79988d21Fa8fAF74E97e"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: new BigNumber("10000000000000000"),
            fee: new BigNumber("0"),
            date: new Date("2023-01-24T17:11:45Z"),
            type: "IN",
            hasFailed: false,
            extra: {},
          };

          expect(ledgerInternalTransactionToOperations(coinOperation, ledgerAction)).toEqual([
            expectedOperation,
          ]);
        });

        it("shoud ignore a ledger explorer action when identical to the Operation it's triggered by", () => {
          const coinOperationFees = coinOperation;
          const coinOperationOut = {
            ...coinOperation,
            type: "OUT" as const,
          };
          const coinOperationIn = {
            ...coinOperation,
            senders: coinOperation.recipients,
            recipients: coinOperation.senders,
            type: "IN" as const,
          };

          const ledgerActionOutOrFees: LedgerExplorerInternalTransaction = {
            from: coinOperationFees.senders[0],
            to: coinOperationFees.recipients[0],
            input: null,
            value: coinOperationFees.value.minus(coinOperationFees.fee).toFixed(),
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const ledgerActionIn: LedgerExplorerInternalTransaction = {
            ...ledgerActionOutOrFees,
            from: coinOperationFees.recipients[0],
            to: coinOperationFees.senders[0],
            value: coinOperationIn.value.toFixed(),
          };

          expect(
            ledgerInternalTransactionToOperations(coinOperationFees, ledgerActionOutOrFees),
          ).toEqual([]);
          expect(
            ledgerInternalTransactionToOperations(coinOperationOut, ledgerActionOutOrFees),
          ).toEqual([]);

          expect(ledgerInternalTransactionToOperations(coinOperationIn, ledgerActionIn)).toEqual(
            [],
          );
        });

        it("should convert a ledger explorer none action to a Ledger Live Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            to: "0x3244100A07c7fEE9bDE409e877ed2e8Ff1EdeEda", // pdv.eth
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          expect(ledgerInternalTransactionToOperations(coinOperation, ledgerAction)).toEqual([]);
        });

        it("should convert a ledger explorer self action to 2 Ledger Live Operations", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            to: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", // pdv.eth
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const expectedOperations: Operation[] = [
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN-i0",
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              accountId,
              blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
              blockHeight: 38476740,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("10000000000000000"),
              fee: new BigNumber("0"),
              date: new Date("2023-01-24T17:11:45Z"),
              type: "IN",
              hasFailed: false,
              extra: {},
            },
            {
              id: "js:2:ethereum:0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d:-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT-i0",
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              accountId,
              blockHash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
              blockHeight: 38476740,
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: new BigNumber("10000000000000000"),
              fee: new BigNumber("0"),
              date: new Date("2023-01-24T17:11:45Z"),
              type: "OUT",
              hasFailed: false,
              extra: {},
            },
          ];

          expect(ledgerInternalTransactionToOperations(coinOperation, ledgerAction)).toEqual(
            expectedOperations,
          );
        });
      });
    });
  });
});
