import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { EvmCoinConfig, setCoinConfig } from "../config";
import etherscanExplorer from "../network/explorer/etherscan";
import ledgerExplorer from "../network/explorer/ledger";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  it.each([
    ["an etherscan explorer", { type: "etherscan" }, etherscanExplorer.explorerApi],
    [
      "a no cache etherscan explorer",
      { type: "etherscan", noCache: true },
      etherscanExplorer.explorerApiNoCache,
    ],
    ["a ledger explorer", { type: "ledger" }, ledgerExplorer],
  ])("lists latest operations using %s", async (_, config, explorer) => {
    setCoinConfig(() => ({ info: { explorer: config } }) as unknown as EvmCoinConfig);
    const getOperationsSpy = jest.spyOn(explorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-1",
          accountId: "",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: new BigNumber(4),
          hash: "coin-op-1-tx-hash",
          blockHeight: 10,
          blockHash: "coin-op-1-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-12"),
          transactionSequenceNumber: new BigNumber(1),
          hasFailed: false,
          extra: {},
        },
        {
          id: "coin-op-2",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address2"],
          value: new BigNumber(28),
          hash: "coin-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(2),
          hasFailed: true,
          extra: {},
        },
        {
          id: "coin-op-3",
          accountId: "",
          type: "FEES",
          senders: ["address"],
          recipients: ["contract-address"],
          value: new BigNumber(0),
          hash: "token-op-1-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(3),
          extra: {},
        },
        {
          id: "coin-op-4",
          accountId: "",
          type: "NONE",
          senders: ["address1"],
          recipients: ["address2"],
          value: new BigNumber(0),
          hash: "token-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(4),
          extra: {},
        },
        {
          id: "coin-op-5",
          accountId: "",
          type: "FEES",
          senders: ["address"],
          recipients: ["contract-address"],
          value: new BigNumber(0),
          hash: "token-op-3-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-3-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(5),
          hasFailed: true,
          extra: {},
        },
        {
          id: "coin-op-6",
          accountId: "",
          type: "NONE",
          senders: ["contract-address"],
          recipients: ["address"],
          value: new BigNumber(0),
          hash: "coin-op-6-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-6-block-hash",
          fee: new BigNumber(15),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(6),
          extra: {},
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-1",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          contract: "contract-address",
          value: new BigNumber(1),
          hash: "token-op-1-tx-hash",
          blockHeight: 20,
          blockHash: "token-op-1-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
        {
          id: "token-op-2",
          accountId: "",
          type: "IN",
          senders: ["address"],
          recipients: ["address2"],
          contract: "contract-address",
          value: new BigNumber(2),
          hash: "token-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "token-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(2),
          extra: {},
        },
        {
          id: "token-op-3",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          contract: "contract-address",
          value: new BigNumber(1),
          hash: "token-op-3-tx-hash",
          blockHeight: 20,
          blockHash: "token-op-3-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(5),
          extra: {},
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [
        // Internal operation WITH matching parent coin operation (coin-op-5).
        // Should be enriched with parent's fee (20) and blockHash ("coin-op-3-block-hash").
        {
          id: "internal-op-1",
          accountId: "",
          type: "IN",
          senders: ["contract-address"],
          recipients: ["address"],
          value: new BigNumber(3),
          hash: "token-op-3-tx-hash", // matches coin-op-5
          blockHeight: 20,
          blockHash: "token-op-3-block-hash", // will be replaced by parent's blockHash
          fee: new BigNumber(0), // will be replaced by parent's fee
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(5),
          extra: {},
        },
        // Internal operation WITH matching parent coin operation (coin-op-6).
        // Should be enriched with parent's fee (0) and blockHash ("coin-op-6-block-hash").
        {
          id: "internal-op-2",
          accountId: "",
          type: "IN",
          senders: ["contract-address"],
          recipients: ["address"],
          value: new BigNumber(5),
          hash: "coin-op-6-tx-hash", // matches coin-op-6
          blockHeight: 20,
          blockHash: "token-op-3-block-hash", // will be replaced by parent's blockHash
          fee: new BigNumber(0), // will be replaced by parent's fee
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(6),
          extra: {},
        },
        // Internal operation with no matching parent coin operation.
        // This happens when the parent transaction was paid for by another
        // account (e.g., swapping to a fresh address via smart contract).
        {
          id: "internal-op-3",
          accountId: "",
          type: "IN",
          senders: ["some-other-contract"],
          recipients: ["address"],
          value: new BigNumber(7),
          hash: "orphan-internal-tx-hash",
          blockHeight: 25,
          blockHash: "",
          fee: new BigNumber(0),
          date: new Date("2025-02-25"),
          transactionSequenceNumber: new BigNumber(7),
          extra: {},
        },
      ],
      nextPagingToken: "",
    });

    const currency = {} as CryptoCurrency;
    const address = "address";
    const minHeight = 5;

    const result = await listOperations(currency, address, { minHeight, order: "asc" });

    const undefinedPagingToken = undefined;
    const undefinedLimit = undefined;
    const undefinedToBlock = undefined;
    const seed = `js:2:${currency.id}:${address}:`;

    expect({ result, calls: getOperationsSpy.mock.calls }).toEqual({
      result: [
        [
          {
            id: "coin-op-1",
            type: "IN",
            senders: ["address1"],
            recipients: ["address"],
            value: 4n,
            asset: { type: "native" },
            tx: {
              hash: "coin-op-1-tx-hash",
              block: {
                height: 10,
                hash: "coin-op-1-block-hash",
                time: new Date("2025-02-12"),
              },
              fees: 20n,
              date: new Date("2025-02-12"),
              failed: false,
            },
            details: { sequence: BigNumber(1) },
          },
          {
            id: "coin-op-2",
            type: "OUT",
            senders: ["address"],
            recipients: ["address2"],
            value: 8n,
            asset: { type: "native" },
            tx: {
              hash: "coin-op-2-tx-hash",
              block: {
                height: 20,
                hash: "coin-op-2-block-hash",
                time: new Date("2025-02-20"),
              },
              fees: 20n,
              date: new Date("2025-02-20"),
              failed: true,
            },
            details: { sequence: BigNumber(2) },
          },
          {
            id: "coin-op-6",
            type: "NONE",
            senders: ["contract-address"],
            recipients: ["address"],
            value: 0n,
            asset: { type: "native" },
            tx: {
              hash: "coin-op-6-tx-hash",
              block: {
                height: 20,
                hash: "coin-op-6-block-hash",
                time: new Date("2025-02-20"),
              },
              fees: 15n,
              date: new Date("2025-02-20"),
              failed: false,
            },
            details: { sequence: BigNumber(6) },
          },
          {
            id: "token-op-1",
            type: "OUT",
            senders: ["address"],
            recipients: ["address1"],
            value: 1n,
            asset: { type: "erc20", assetReference: "contract-address", assetOwner: "address" },
            tx: {
              hash: "token-op-1-tx-hash",
              block: {
                height: 20,
                hash: "token-op-1-block-hash",
                time: new Date("2025-02-20"),
              },
              fees: 20n,
              date: new Date("2025-02-20"),
              failed: false,
            },
            details: {
              ledgerOpType: "OUT",
              assetAmount: "1",
              assetSenders: ["address"],
              assetRecipients: ["address1"],
              parentSenders: ["address"],
              parentRecipients: ["contract-address"],
              sequence: BigNumber(1),
            },
          },
          {
            id: "token-op-2",
            type: "IN",
            senders: ["address"],
            recipients: ["address2"],
            value: 2n,
            asset: {
              assetOwner: "address",
              assetReference: "contract-address",
              type: "erc20",
            },
            tx: {
              hash: "token-op-2-tx-hash",
              block: {
                hash: "token-op-2-block-hash",
                height: 20,
                time: new Date("2025-02-20"),
              },
              date: new Date("2025-02-20"),
              fees: 20n,
              failed: false,
            },
            details: {
              assetAmount: "2",
              ledgerOpType: "IN",
              assetSenders: ["address"],
              assetRecipients: ["address2"],
              parentSenders: ["address1"],
              parentRecipients: ["address2"],
              sequence: BigNumber(2),
            },
          },
          {
            id: "token-op-3",
            type: "OUT",
            senders: ["address"],
            recipients: ["address1"],
            value: 1n,
            asset: { type: "erc20", assetReference: "contract-address", assetOwner: "address" },
            tx: {
              hash: "token-op-3-tx-hash",
              block: {
                height: 20,
                hash: "token-op-3-block-hash",
                time: new Date("2025-02-20"),
              },
              fees: 20n,
              date: new Date("2025-02-20"),
              failed: true,
            },
            details: {
              ledgerOpType: "OUT",
              assetAmount: "1",
              assetSenders: ["address"],
              assetRecipients: ["address1"],
              parentSenders: ["address"],
              parentRecipients: ["contract-address"],
              sequence: BigNumber(5),
            },
          },
          {
            id: "internal-op-1",
            type: "IN",
            recipients: ["address"],
            senders: ["contract-address"],
            value: 3n,
            asset: { type: "native" },
            tx: {
              block: {
                hash: "coin-op-3-block-hash",
                height: 20,
                time: new Date("2025-02-20"),
              },
              date: new Date("2025-02-20"),
              failed: false,
              fees: 20n,
              hash: "token-op-3-tx-hash",
            },
            details: {
              internal: true,
              sequence: new BigNumber(5),
            },
          },
          {
            id: "internal-op-2",
            type: "IN",
            recipients: ["address"],
            senders: ["contract-address"],
            value: 5n,
            asset: { type: "native" },
            tx: {
              block: {
                hash: "coin-op-6-block-hash",
                height: 20,
                time: new Date("2025-02-20"),
              },
              date: new Date("2025-02-20"),
              failed: false,
              fees: 15n,
              hash: "coin-op-6-tx-hash",
            },
            details: {
              internal: true,
              sequence: new BigNumber(6),
            },
          },
          // Internal operation with no matching parent - should still be included
          // with its own default values (fee=0, blockHash="").
          {
            id: "internal-op-3",
            type: "IN",
            recipients: ["address"],
            senders: ["some-other-contract"],
            value: 7n,
            asset: { type: "native" },
            tx: {
              block: {
                hash: "",
                height: 25,
                time: new Date("2025-02-25"),
              },
              date: new Date("2025-02-25"),
              failed: false,
              fees: 0n,
              hash: "orphan-internal-tx-hash",
            },
            details: {
              internal: true,
              sequence: new BigNumber(7),
            },
          },
        ],
        "",
      ],
      // check that the order passed to exploer is "desc" when no limit is set
      calls: [
        [
          currency,
          address,
          seed,
          minHeight,
          undefinedToBlock,
          undefinedPagingToken,
          undefinedLimit,
          "desc",
        ],
      ],
    });
  });

  it("filters out operations where the requested address is not involved (case insensitive)", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
    const address = "address";
    // Explorer returns: one native op for "address", and one internal op (same tx) where
    // senders/recipients and parent senders/recipients do NOT include "address"
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-for-address",
          accountId: "",
          type: "OUT",
          senders: [address.toUpperCase()],
          recipients: ["address2"],
          value: new BigNumber(100),
          hash: "0xTxForAddress",
          blockHeight: 100,
          blockHash: "0xBlockHash",
          fee: new BigNumber(10),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
        {
          id: "coin-op-unrelated",
          accountId: "",
          type: "OUT",
          senders: ["0xOtherA"],
          recipients: ["0xOtherB"],
          value: new BigNumber(0),
          hash: "0xTxUnrelated",
          blockHeight: 101,
          blockHash: "0xBlockHash2",
          fee: new BigNumber(10),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(2),
          extra: {},
        },
      ],
      lastTokenOperations: [],
      lastNftOperations: [],
      lastInternalOperations: [
        {
          id: "internal-op-unrelated",
          accountId: "",
          type: "IN",
          senders: ["0xOtherA"],
          recipients: ["0xOtherB"],
          value: new BigNumber(50),
          hash: "0xTxUnrelated",
          blockHeight: 101,
          blockHash: "0xBlockHash2",
          fee: new BigNumber(0),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(2),
          extra: {},
        },
      ],
    });

    expect(
      await listOperations({} as CryptoCurrency, address.toLowerCase(), {
        minHeight: 1,
        order: "asc",
      }),
    ).toEqual([
      [
        {
          id: "coin-op-for-address",
          type: "OUT",
          senders: [address.toUpperCase()],
          recipients: ["address2"],
          value: 90n, // value - fee = 100 - 10
          asset: { type: "native" },
          tx: {
            hash: "0xTxForAddress",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 10n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      undefined,
    ]);
  });

  it("should use token transfer value for ERC20 operations, not parent native value", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    const erc20TransferValue = new BigNumber("666"); // The actual ERC20 amount
    const parentNativeValue = new BigNumber("0"); // No native ETH transferred
    const txFee = new BigNumber("21000000000000"); // Tx fees

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-erc20-tx",
          accountId: "",
          type: "FEES", // FEES type because it's a pure ERC20 transfer
          senders: ["address1"],
          recipients: ["address2"], // contract address
          value: parentNativeValue,
          hash: "0x4235dc16c74aecb248ad1005f3a0c82582a25afe797e62ecc8f4eed86ca628a1",
          blockHeight: 279040,
          blockHash: "0x172b9bcb8f7d598227ab5f7f0ce",
          fee: txFee,
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-erc20",
          accountId: "",
          type: "OUT",
          senders: ["address1"],
          recipients: ["0xD656ab767968Fb3954cb1a16D525B540e1AfA00d"],
          contract: "address2",
          value: erc20TransferValue, // The actual ERC20 transfer amount
          hash: "0x4235dc16c74aecb248ad1005f3a0c82582a25afe797e62ecc8f4eed86ca628a1",
          blockHeight: 279040,
          blockHash: "0x172b9bcb8f7d598227ab5f7f0ce",
          fee: txFee,
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [],
    });

    expect(
      await listOperations({} as CryptoCurrency, "address1", { minHeight: 1, order: "asc" }),
    ).toEqual([
      [
        {
          id: "token-op-erc20",
          type: "OUT",
          senders: ["address1"],
          recipients: ["0xD656ab767968Fb3954cb1a16D525B540e1AfA00d"],
          value: 666n,
          asset: { type: "erc20", assetReference: "address2", assetOwner: "address1" },
          tx: {
            hash: "0x4235dc16c74aecb248ad1005f3a0c82582a25afe797e62ecc8f4eed86ca628a1",
            block: {
              height: 279040,
              hash: "0x172b9bcb8f7d598227ab5f7f0ce",
              time: new Date("2025-02-20"),
            },
            fees: 21000000000000n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "666",
            assetSenders: ["address1"],
            assetRecipients: ["0xD656ab767968Fb3954cb1a16D525B540e1AfA00d"],
            parentSenders: ["address1"],
            parentRecipients: ["address2"],
            sequence: BigNumber(1),
          },
        },
      ],
      undefined,
    ]);
  });

  it("should emit both native and token operations when tx has native value > 0 and token transfers", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    const nativeTransferValue = new BigNumber("1000000000000000000"); // 1 ETH
    const erc20TransferValue = new BigNumber("500000000"); // 500 USDC
    const txFee = new BigNumber("21000000000000"); // Tx fees

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-mixed-tx",
          accountId: "",
          type: "OUT", // OUT type because native ETH is transferred
          senders: ["address1"],
          recipients: ["address2"],
          value: nativeTransferValue, // Native ETH transferred
          hash: "0xMixedTransactionHash",
          blockHeight: 100,
          blockHash: "0xBlockHash",
          fee: txFee,
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-mixed-tx",
          accountId: "",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address3"],
          contract: "0xUSDCContract",
          value: erc20TransferValue,
          hash: "0xMixedTransactionHash", // Same tx hash
          blockHeight: 100,
          blockHash: "0xBlockHash",
          fee: txFee,
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [],
    });

    expect(
      await listOperations({} as CryptoCurrency, "address1", { minHeight: 1, order: "asc" }),
    ).toEqual([
      [
        {
          id: "coin-op-mixed-tx",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address2"],
          value: 999979000000000000n, // native value - fee
          asset: { type: "native" },
          tx: {
            hash: "0xMixedTransactionHash",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 21000000000000n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
        {
          id: "token-op-mixed-tx",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address3"],
          value: 500000000n,
          asset: {
            type: "erc20",
            assetReference: "0xUSDCContract",
            assetOwner: "address1",
          },
          tx: {
            hash: "0xMixedTransactionHash",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 21000000000000n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "500000000",
            assetSenders: ["address1"],
            assetRecipients: ["address3"],
            parentSenders: ["address1"],
            parentRecipients: ["address2"],
            sequence: BigNumber(1),
          },
        },
      ],
      undefined,
    ]);
  });

  it("should emit native operation with type=FEES when value=0 and no token children", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    const txFee = new BigNumber("21000000000000");

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-fees-only",
          accountId: "",
          type: "FEES", // Explorer marks it as FEES
          senders: ["address1"],
          recipients: ["0xContractAddress"],
          value: new BigNumber(0), // No value transferred
          hash: "0xFeesOnlyTxHash",
          blockHeight: 100,
          blockHash: "0xBlockHash",
          fee: txFee,
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastTokenOperations: [], // No token operations
      lastNftOperations: [],
      lastInternalOperations: [],
    });

    expect(
      await listOperations({} as CryptoCurrency, "address1", { minHeight: 1, order: "asc" }),
    ).toEqual([
      [
        {
          id: "coin-op-fees-only",
          type: "FEES",
          senders: ["address1"],
          recipients: ["0xContractAddress"],
          value: -21000000000000n, // value - fee = 0 - fee
          asset: { type: "native" },
          tx: {
            hash: "0xFeesOnlyTxHash",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 21000000000000n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      undefined,
    ]);
  });
});
