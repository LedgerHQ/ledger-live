import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
import {
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerInternalTransaction,
  LedgerExplorerOperation,
} from "./../types";
import {
  ledgerERC1155EventToOperations,
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerInternalTransactionToOperations,
  ledgerOperationToOperations,
} from "./ledger";

const address = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";
const currencyId = "ethereum";

const coinOperation: Operation<MemoNotSupported> = {
  id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-FEES",
  type: "FEES",
  senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
  recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
  value: 0n,
  asset: { type: "native" },
  tx: {
    hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
    block: {
      height: 38476740,
      hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
      time: new Date("2023-01-24T17:11:45Z"),
    },
    fees: 4254163264389158n,
    date: new Date("2023-01-24T17:11:45Z"),
    failed: false,
  },
  details: { sequence: 75 },
};

describe("EVM Family", () => {
  describe("adapters", () => {
    describe("ledger", () => {
      describe("ledgerOperationToOperations", () => {
        it("should convert a ledger explorer smart contract creation operation (from their API) to an Operation", () => {
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

          const unrelatedAddress = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";

          const expectedOperation = {
            id: "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NONE",
            type: "NONE",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: [],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              block: {
                height: 38476740,
                hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
                time: new Date("2023-01-24T17:11:45Z"),
              },
              fees: 4254163264389158n,
              date: new Date("2023-01-24T17:11:45Z"),
              failed: false,
              feesPayer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            },
            details: { sequence: 75 },
          };

          expect(
            ledgerOperationToOperations(unrelatedAddress, "ethereum", ledgerExplorerOp),
          ).toEqual([expectedOperation]);
        });

        it("should convert ledger explorer smart contract operation to an Operation", () => {
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

          const expectedOperation = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-FEES",
            type: "FEES",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              block: {
                height: 38476740,
                hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
                time: new Date("2023-01-24T17:11:45Z"),
              },
              fees: 4254163264389158n,
              date: new Date("2023-01-24T17:11:45Z"),
              failed: false,
              feesPayer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            },
            details: { sequence: 75 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin out operation to an Operation", () => {
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

          const expectedOperation = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            value: 1n,
            asset: { type: "native" },
            tx: {
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              block: {
                height: 38476740,
                hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
                time: new Date("2023-01-24T17:11:45Z"),
              },
              fees: 4254163264389158n,
              date: new Date("2023-01-24T17:11:45Z"),
              failed: false,
              feesPayer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            },
            details: { sequence: 75 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin in operation to an Operation", () => {
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

          const expectedOperation = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
            type: "IN",
            senders: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "native" },
            tx: {
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              block: {
                height: 38476740,
                hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
                time: new Date("2023-01-24T17:11:45Z"),
              },
              fees: 4254163264389158n,
              date: new Date("2023-01-24T17:11:45Z"),
              failed: false,
              feesPayer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            },
            details: { sequence: 75 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer coin none operation to an Operation", () => {
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

          const expectedOperation = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-NONE",
            type: "NONE",
            senders: ["0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 1n,
            asset: { type: "native" },
            tx: {
              hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
              block: {
                height: 38476740,
                hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
                time: new Date("2023-01-24T17:11:45Z"),
              },
              fees: 4254163264389158n,
              date: new Date("2023-01-24T17:11:45Z"),
              failed: false,
              feesPayer: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            },
            details: { sequence: 75 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer legacy coin none operation (smart contract creation) to an Operation", () => {
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

          const expectedOperation = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1-NONE",
            type: "NONE",
            senders: ["0x787aCF62fFC81Bb171d1f46fB8b3Fc6503D503e8"],
            recipients: [],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "0x11a358387669d58f3791461124212e40e6899fd286074636f745990f57f87eb1",
              block: {
                height: 36795782,
                hash: "0xcf0072dc5eb6e39ae5377b5323914f750da0cf5d2538f7d3ce7d8739c0624199",
                time: new Date("2022-12-13T21:41:37Z"),
              },
              fees: 905335872155003804n,
              date: new Date("2022-12-13T21:41:37Z"),
              failed: false,
              feesPayer: "0x787aCF62fFC81Bb171d1f46fB8b3Fc6503D503e8",
            },
            details: { sequence: 3 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert ledger explorer self send coin operation to 2 Operations", () => {
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

          const selfSendTx = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            block: {
              height: 38476740,
              hash: "0xcbd52de09904fd89a94b0638a8e39107e247d761e92411fd5b7b7d8b88641ddd",
              time: new Date("2023-01-24T17:11:45Z"),
            },
            fees: 4254163264389158n,
            date: new Date("2023-01-24T17:11:45Z"),
            failed: false,
            feesPayer: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
          };

          const expectedOperation1 = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-IN",
            type: "IN",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "native" },
            tx: selfSendTx,
            details: { sequence: 75 },
          };
          const expectedOperation2 = {
            id: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d-0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "native" },
            tx: selfSendTx,
            details: { sequence: 75 },
          };

          expect(ledgerOperationToOperations(address, currencyId, ledgerOperation)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });

        it("should return an operation with the expected amount", () => {
          const unrelatedAddress = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";

          const ledgerExplorerNoneOp: LedgerExplorerOperation = {
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

          // Successful Op
          expect(
            ledgerOperationToOperations(unrelatedAddress, "ethereum", ledgerExplorerNoneOp)[0]
              .value,
          ).toEqual(BigInt(ledgerExplorerNoneOp.value));
          // Failing Op
          expect(
            ledgerOperationToOperations(unrelatedAddress, "ethereum", {
              ...ledgerExplorerNoneOp,
              status: 0,
            })[0].value,
          ).toEqual(BigInt(ledgerExplorerNoneOp.value));

          const ledgerExplorerFeesOp: LedgerExplorerOperation = {
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

          // Successful Op (value = transferred only; fee is separate; Ledger Wallet adds fee in bridge)
          expect(
            ledgerOperationToOperations(address, currencyId, ledgerExplorerFeesOp)[0].value,
          ).toEqual(BigInt(ledgerExplorerFeesOp.value));
          // Failing Op (value = tx value, same as success)
          expect(
            ledgerOperationToOperations(address, currencyId, {
              ...ledgerExplorerFeesOp,
              status: 0,
            })[0].value,
          ).toEqual(BigInt(ledgerExplorerFeesOp.value));

          const ledgerOperationOut: LedgerExplorerOperation = {
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

          // Successful Op (value = transferred only; fee is separate; Ledger Wallet adds fee in bridge)
          expect(
            ledgerOperationToOperations(address, currencyId, ledgerOperationOut)[0].value,
          ).toEqual(BigInt(ledgerOperationOut.value));
          // Failing Op (value = tx value, same as success)
          expect(
            ledgerOperationToOperations(address, currencyId, {
              ...ledgerOperationOut,
              status: 0,
            })[0].value,
          ).toEqual(BigInt(ledgerOperationOut.value));

          const ledgerOperationIn: LedgerExplorerOperation = {
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

          // Successful Op
          expect(
            ledgerOperationToOperations(address, currencyId, ledgerOperationIn)[0].value,
          ).toEqual(BigInt(ledgerOperationOut.value));
          // Failing Op
          expect(
            ledgerOperationToOperations(address, currencyId, { ...ledgerOperationIn, status: 0 })[0]
              .value,
          ).toEqual(BigInt(ledgerOperationOut.value));
        });

        it("should produce empty recipients when to is an empty string", () => {
          const ledgerOp: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1000",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "",
            transfer_events: [],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 1,
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

          const result = ledgerOperationToOperations(address, currencyId, ledgerOp);

          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });

        it("should produce empty senders when from is an empty string", () => {
          const ledgerOp: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "1000",
            gas: "62350",
            gas_price: "81876963401",
            max_fee_per_gas: "125263305914",
            max_priority_fee_per_gas: "33000000000",
            from: "",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            transfer_events: [],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 1,
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

          const result = ledgerOperationToOperations(address, currencyId, ledgerOp);

          expect(result).toHaveLength(1);
          expect(result[0].senders).toEqual([]);
        });

        it("should detect a Monad staking withdraw (value 0 contract call) as a WITHDRAW_UNBONDED operation instead of FEES", () => {
          const monadAddress = "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d";
          const monadCurrencyId = "monad";

          const ledgerOp: LedgerExplorerOperation = {
            hash: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79",
            transaction_type: 2,
            nonce: "0x4b",
            nonce_value: 75,
            value: "0",
            gas: "62350",
            gas_price: "81876342142",
            max_fee_per_gas: "85000000000",
            max_priority_fee_per_gas: "33000000000",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            // Monad native staking precompile
            to: "0x0000000000000000000000000000000000001000",
            transfer_events: [],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [],
            confirmations: 10,
            // withdraw(uint64 validatorId, uint8 withdrawId) selector + args
            input:
              "0xaed2ee73" +
              "0000000000000000000000000000000000000000000000000000000000000007" +
              "0000000000000000000000000000000000000000000000000000000000000002",
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

          const result = ledgerOperationToOperations(monadAddress, monadCurrencyId, ledgerOp);

          expect(result).toHaveLength(1);
          expect(result[0].type).toBe("WITHDRAW_UNBONDED");
        });
      });

      describe("ledgerERC20EventToOperations", () => {
        it("should convert a ledger explorer usdc out event to an Operation", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            count: "100000000000000",
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc20-0-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 100000000000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "OUT",
              assetAmount: "100000000000000",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            },
          };

          expect(ledgerERC20EventToOperations(address, coinOperation, ledgerERC20Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a ledger explorer usdc in event to an Operation", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            count: "100000000000000",
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc20-0-IN",
            type: "IN",
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 100000000000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "IN",
              assetAmount: "100000000000000",
              assetSenders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(ledgerERC20EventToOperations(address, coinOperation, ledgerERC20Event)).toEqual([
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

          expect(ledgerERC20EventToOperations(address, coinOperation, ledgerERC20Event)).toEqual(
            [],
          );
        });

        it("should convert a ledger explorer self usdc event into 2 Operations", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            count: "100000000000000",
          };

          const expectedOperation1 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc20-0-IN",
            type: "IN",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 100000000000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "IN",
              assetAmount: "100000000000000",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation2 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc20-0-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 100000000000000n,
            asset: {
              type: "erc20",
              assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "OUT",
              assetAmount: "100000000000000",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(ledgerERC20EventToOperations(address, coinOperation, ledgerERC20Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });

        it("should produce empty recipients when to is an empty string", () => {
          const ledgerERC20Event: LedgerExplorerERC20TransferEvent = {
            contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "",
            count: "100000000000000",
          };

          const result = ledgerERC20EventToOperations(address, coinOperation, ledgerERC20Event);

          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });

      describe("ledgerERC721EventToOperations", () => {
        it("should convert a ledger explorer erc721 nft out event to an Operation", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc721-0-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 1n,
            asset: {
              type: "erc721",
              assetReference: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId:
                "49183440411075624253866807957299276245920874859439606792850319902048050479106",
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            },
          };

          expect(ledgerERC721EventToOperations(address, coinOperation, ledgerERC721Event)).toEqual([
            expectedOperation,
          ]);
        });

        it("should convert a ledger explorer erc721 nft in event to an Operation", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0xc2907efcce4011c491bbeda8a0fa63ba7aab596c",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc721-0-NFT_IN",
            type: "NFT_IN",
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: {
              type: "erc721",
              assetReference: "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A",
              assetOwner: address,
            },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId:
                "49183440411075624253866807957299276245920874859439606792850319902048050479106",
              assetAmount: "1",
              assetSenders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(ledgerERC721EventToOperations(address, coinOperation, ledgerERC721Event)).toEqual([
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

          expect(ledgerERC721EventToOperations(address, coinOperation, ledgerERC721Event)).toEqual(
            [],
          );
        });

        it("should convert a ledger explorer erc721 nft event into 2 Operations", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const tokenId =
            "49183440411075624253866807957299276245920874859439606792850319902048050479106";
          const contract721 = "0x9a29E4e488Ab34FB792C0bD9ada78C2c07Ebe55A";

          const expectedOperation1 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc721-0-NFT_IN",
            type: "NFT_IN",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc721", assetReference: contract721, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId,
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation2 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc721-0-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc721", assetReference: contract721, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId,
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(ledgerERC721EventToOperations(address, coinOperation, ledgerERC721Event)).toEqual([
            expectedOperation1,
            expectedOperation2,
          ]);
        });

        it("should produce empty recipients when receiver is an empty string", () => {
          const ledgerERC721Event: LedgerExplorerER721TransferEvent = {
            contract: "0x9a29e4e488ab34fb792c0bd9ada78c2c07ebe55a",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "",
            token_id:
              "49183440411075624253866807957299276245920874859439606792850319902048050479106",
          };

          const result = ledgerERC721EventToOperations(address, coinOperation, ledgerERC721Event);

          // sender matches account → NFT_OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });

      describe("ledgerERC1155EventToOperations", () => {
        it("should convert a ledger explorer erc721 nft out event to an Operation", () => {
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

          const contract1155 = "0x2953399124F0cBB46d2CbACD8A89cF0599974963";
          const tokenId1155 =
            "49183440411075624253866807957299276245920874859439606792850319904247073734666";

          const expectedOperation1 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-0-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 1n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId: tokenId1155,
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            },
          };
          const expectedOperation2 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-1-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            value: 2n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId: tokenId1155,
              assetAmount: "2",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            },
          };

          expect(
            ledgerERC1155EventToOperations(address, coinOperation, ledgerERC1155Event),
          ).toEqual([expectedOperation1, expectedOperation2]);
        });

        it("should convert a ledger explorer erc721 nft in event to an Operation", () => {
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

          const contract1155 = "0x2953399124F0cBB46d2CbACD8A89cF0599974963";
          const tokenId1155 =
            "49183440411075624253866807957299276245920874859439606792850319904247073734666";

          const expectedOperation1 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-0-NFT_IN",
            type: "NFT_IN",
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId: tokenId1155,
              assetAmount: "1",
              assetSenders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation2 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-1-NFT_IN",
            type: "NFT_IN",
            senders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 2n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId: tokenId1155,
              assetAmount: "2",
              assetSenders: ["0xC2907EFccE4011C491BbedA8A0fA63BA7aab596C"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(
            ledgerERC1155EventToOperations(address, coinOperation, ledgerERC1155Event),
          ).toEqual([expectedOperation1, expectedOperation2]);
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

          expect(
            ledgerERC1155EventToOperations(address, coinOperation, ledgerERC1155Event),
          ).toEqual([]);
        });

        it("should convert a ledger explorer erc721 nft event into 2 Operations", () => {
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

          const contract1155 = "0x2953399124F0cBB46d2CbACD8A89cF0599974963";
          const tokenId1155 =
            "49183440411075624253866807957299276245920874859439606792850319904247073734666";

          const expectedOperation1 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-0-NFT_IN",
            type: "NFT_IN",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId: tokenId1155,
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation2 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-0-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 1n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId: tokenId1155,
              assetAmount: "1",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation3 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-1-NFT_IN",
            type: "NFT_IN",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 2n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_IN",
              tokenId: tokenId1155,
              assetAmount: "2",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };
          const expectedOperation4 = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-erc1155-0-1-NFT_OUT",
            type: "NFT_OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 2n,
            asset: { type: "erc1155", assetReference: contract1155, assetOwner: address },
            tx: coinOperation.tx,
            details: {
              ledgerOpType: "NFT_OUT",
              tokenId: tokenId1155,
              assetAmount: "2",
              assetSenders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              assetRecipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            },
          };

          expect(
            ledgerERC1155EventToOperations(address, coinOperation, ledgerERC1155Event),
          ).toEqual([
            expectedOperation1,
            expectedOperation2,
            expectedOperation3,
            expectedOperation4,
          ]);
        });

        it("should produce empty recipients when receiver is an empty string", () => {
          const ledgerERC1155Event: LedgerExplorerER1155TransferEvent = {
            contract: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
            sender: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            operator: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            receiver: "",
            transfers: [{ id: "10371", value: "1" }],
          };

          const result = ledgerERC1155EventToOperations(address, coinOperation, ledgerERC1155Event);

          // sender matches account → NFT_OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });

      describe("ledgerInternalTransactionToOperations", () => {
        it("should ignore explorer actions for a if the coin operation has failed", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          expect(
            ledgerInternalTransactionToOperations(
              address,
              { ...coinOperation, tx: { ...coinOperation.tx, failed: true } },
              ledgerAction,
            ),
          ).toEqual([]);
        });

        it("should convert a ledger explorer out action to an Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-internal-0-OUT",
            type: "OUT",
            senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            recipients: ["0x49048044D57e1C92A77f79988d21Fa8fAF74E97e"],
            value: 10000000000000000n,
            asset: { type: "native" },
            tx: { ...coinOperation.tx, fees: 0n },
            details: { internal: true, hasFailed: false },
          };

          expect(
            ledgerInternalTransactionToOperations(address, coinOperation, ledgerAction),
          ).toEqual([expectedOperation]);
        });

        it("should convert a ledger explorer in action to an Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            to: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const expectedOperation = {
            id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-internal-0-IN",
            type: "IN",
            senders: ["0x49048044D57e1C92A77f79988d21Fa8fAF74E97e"],
            recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
            value: 10000000000000000n,
            asset: { type: "native" },
            tx: { ...coinOperation.tx, fees: 0n },
            details: { internal: true, hasFailed: false },
          };

          expect(
            ledgerInternalTransactionToOperations(address, coinOperation, ledgerAction),
          ).toEqual([expectedOperation]);
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

          // Action value must match coin op value (transferred amount) for deduplication
          const ledgerActionOutOrFees: LedgerExplorerInternalTransaction = {
            from: coinOperationFees.senders[0],
            to: coinOperationFees.recipients[0],
            input: null,
            value: coinOperationFees.value.toString(),
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const ledgerActionIn: LedgerExplorerInternalTransaction = {
            ...ledgerActionOutOrFees,
            from: coinOperationFees.recipients[0],
            to: coinOperationFees.senders[0],
            value: coinOperationIn.value.toString(),
          };

          expect(
            ledgerInternalTransactionToOperations(
              address,
              coinOperationFees,
              ledgerActionOutOrFees,
            ),
          ).toEqual([]);
          expect(
            ledgerInternalTransactionToOperations(address, coinOperationOut, ledgerActionOutOrFees),
          ).toEqual([]);

          expect(
            ledgerInternalTransactionToOperations(address, coinOperationIn, ledgerActionIn),
          ).toEqual([]);
        });

        it("should emit internal op when action has same from/to but value differs from coin op value", () => {
          // Deduplication only when action.value === coinOperation.value (transferred amount)
          const coinOpOutWithTransfer = {
            ...coinOperation,
            type: "OUT" as const,
            value: 10000000000000000n,
          };
          const actionSameFromToDifferentValue: LedgerExplorerInternalTransaction = {
            from: coinOpOutWithTransfer.senders[0],
            to: coinOpOutWithTransfer.recipients[0],
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };
          // Value matches → filtered
          expect(
            ledgerInternalTransactionToOperations(
              address,
              coinOpOutWithTransfer,
              actionSameFromToDifferentValue,
            ),
          ).toEqual([]);

          const actionDifferentValue: LedgerExplorerInternalTransaction = {
            ...actionSameFromToDifferentValue,
            value: "1",
          };
          // Value differs → internal op emitted
          const result = ledgerInternalTransactionToOperations(
            address,
            coinOpOutWithTransfer,
            actionDifferentValue,
          );
          expect(result).toHaveLength(1);
          expect(result[0].value.toString()).toBe("1");
        });

        it("should convert a ledger explorer none action to an Operation", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x49048044d57e1c92a77f79988d21fa8faf74e97e",
            to: "0x3244100A07c7fEE9bDE409e877ed2e8Ff1EdeEda", // pdv.eth
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          expect(
            ledgerInternalTransactionToOperations(address, coinOperation, ledgerAction),
          ).toEqual([]);
        });

        it("should convert a ledger explorer self action to 2 Operations", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            to: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", // pdv.eth
            input: null,
            value: "10000000000000000",
            gas: "57090",
            gas_used: "27485",
            error: null,
          };

          const internalTx = { ...coinOperation.tx, fees: 0n };

          const expectedOperations = [
            {
              id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-internal-0-IN",
              type: "IN",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 10000000000000000n,
              asset: { type: "native" },
              tx: internalTx,
              details: { internal: true, hasFailed: false },
            },
            {
              id: "0xf350d4f8e910419e2d5cec294d44e69af8c6185b7089061d33bb4fc246cefb79-internal-0-OUT",
              type: "OUT",
              senders: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              recipients: ["0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d"],
              value: 10000000000000000n,
              asset: { type: "native" },
              tx: internalTx,
              details: { internal: true, hasFailed: false },
            },
          ];

          expect(
            ledgerInternalTransactionToOperations(address, coinOperation, ledgerAction),
          ).toEqual(expectedOperations);
        });

        it("should produce empty recipients when to is an empty string", () => {
          const ledgerAction: LedgerExplorerInternalTransaction = {
            from: "0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d",
            to: "",
            input: null,
            value: "10000000000000000",
            gas: null,
            gas_used: null,
            error: null,
          };

          const result = ledgerInternalTransactionToOperations(
            address,
            coinOperation,
            ledgerAction,
          );

          // from matches account → OUT is emitted, but recipients must not contain empty string
          expect(result).toHaveLength(1);
          expect(result[0].recipients).toEqual([]);
        });
      });
    });
  });
});
