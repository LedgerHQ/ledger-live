import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { EvmCoinConfig, setCoinConfig } from "../config";
import etherscanExplorer from "../network/explorer/etherscan";
import ledgerExplorer from "../network/explorer/ledger";
import { ExplorerApi } from "../network/explorer/types";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  const currency = {} as CryptoCurrency;
  const address = "address";

  afterEach(() => {
    jest.clearAllMocks();
  });

  const buildOperationsSpy = (explorer: ExplorerApi) =>
    jest.spyOn(explorer, "getOperations").mockResolvedValue({
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
        // Should be enriched with parent's fee (20), feesPayer (address), and blockHash ("coin-op-3-block-hash").
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
        // Should not be enriched with feesPayer (some-other-contract),
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
    const getOperationsSpy = buildOperationsSpy(explorer);
    const minHeight = 5;

    // here order is "asc" but that's just the sort order, not how the explorer is queried
    const result = await listOperations(currency, address, { minHeight, order: "asc" });

    const undefinedPagingToken = undefined;
    const undefinedLimit = undefined;
    const undefinedToBlock = undefined;
    const seed = `js:2:${currency.id}:${address}:`;

    expect({ result, calls: getOperationsSpy.mock.calls }).toEqual({
      result: {
        items: [
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
              feesPayer: "address1", // feesPayer is always the sender of the native operation
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
            value: 28n,
            asset: { type: "native" },
            tx: {
              hash: "coin-op-2-tx-hash",
              block: {
                height: 20,
                hash: "coin-op-2-block-hash",
                time: new Date("2025-02-20"),
              },
              fees: 20n,
              feesPayer: "address", // feesPayer is always the sender of the native operation
              date: new Date("2025-02-20"),
              failed: true,
            },
            details: { sequence: BigNumber(2) },
          },
          {
            id: "coin-op-6",
            type: "IN",
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
              feesPayer: "contract-address", // feesPayer is always the sender of the native operation
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
              feesPayer: "address", // feesPayer is the parent sender of the token operation
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
            type: "OUT",
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
              feesPayer: "address1", // feesPayer is the parent sender of the token operation
              failed: false,
            },
            details: {
              assetAmount: "2",
              ledgerOpType: "OUT",
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
              feesPayer: "address", // feesPayer is the parent sender of the token operation
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
          // Internal operation WITH parent - enriched with parent's fee and blockHash
          {
            id: "internal-op-1",
            type: "IN",
            recipients: ["address"],
            senders: ["contract-address"],
            value: 3n,
            asset: { type: "native" },
            tx: {
              block: {
                hash: "coin-op-3-block-hash", // from parent coin-op-5
                height: 20,
                time: new Date("2025-02-20"),
              },
              date: new Date("2025-02-20"),
              failed: false,
              fees: 20n, // from parent coin-op-5
              feesPayer: "address", // feesPayer is the parent sender of the internal operation
              hash: "token-op-3-tx-hash",
            },
            details: {
              internal: true,
              sequence: new BigNumber(5),
            },
          },
          // Internal operation WITH parent - enriched with parent's fee and blockHash
          {
            id: "internal-op-2",
            type: "IN",
            recipients: ["address"],
            senders: ["contract-address"],
            value: 5n,
            asset: { type: "native" },
            tx: {
              block: {
                hash: "coin-op-6-block-hash", // from parent coin-op-6
                height: 20,
                time: new Date("2025-02-20"),
              },
              date: new Date("2025-02-20"),
              failed: false,
              fees: 15n, // from parent coin-op-6 (internal-op-2 has fee=0)
              feesPayer: "contract-address", // feesPayer is the parent sender of the internal operation
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
              // no feesPayer for orphan internal operation
              hash: "orphan-internal-tx-hash",
            },
            details: {
              internal: true,
              sequence: new BigNumber(7),
            },
          },
        ],
        next: "",
      },
      calls: [
        [
          currency,
          address,
          seed,
          minHeight,
          undefinedToBlock,
          undefinedPagingToken,
          // defaults to "desc" without limit
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
      nextPagingToken: "",
    });

    expect(
      await listOperations({} as CryptoCurrency, address.toLowerCase(), {
        minHeight: 1,
        order: "asc",
      }),
    ).toEqual({
      items: [
        {
          id: "coin-op-for-address",
          type: "OUT",
          senders: [address.toUpperCase()],
          recipients: ["address2"],
          value: 100n,
          asset: { type: "native" },
          tx: {
            hash: "0xTxForAddress",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 10n,
            feesPayer: "ADDRESS",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      next: "",
    });
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
      nextPagingToken: "",
    });

    expect(
      await listOperations({} as CryptoCurrency, "address1", { minHeight: 1, order: "asc" }),
    ).toEqual({
      items: [
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
            feesPayer: "address1",
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
      next: "",
    });
  });

  it("leaves feesPayer undefined when token op has no parent coin op (no reference operation)", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    const recipient = "0xrecipient";
    const sender = "0xsender";
    const txHash = "0xTokenTxNoParent";
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-other-tx",
          accountId: "",
          type: "OUT",
          senders: [recipient],
          recipients: ["0xOther"],
          value: new BigNumber(0),
          hash: "0xOtherTxHash",
          blockHeight: 100,
          blockHash: "0xBlockHash",
          fee: new BigNumber(1),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          extra: {},
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-in",
          accountId: "",
          type: "IN",
          senders: [sender],
          recipients: [recipient],
          contract: "0xUSDT",
          value: new BigNumber(100),
          hash: txHash,
          blockHeight: 101,
          blockHash: "0xBlockHash2",
          fee: new BigNumber(0),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(2),
          extra: {},
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [],
      nextPagingToken: "",
    });

    const { items } = await listOperations({} as CryptoCurrency, recipient, {
      minHeight: 1,
      order: "asc",
    });
    const tokenInOp = items.find(op => op.tx.hash === txHash && op.asset.type === "erc20");
    expect(tokenInOp!.type).toBe("IN");
    expect(tokenInOp!.tx.feesPayer).toBeUndefined();
  });

  /**
   * Explorers may attach an inflated or summed `fee` on token transfer rows; canonical tx gas is on the coin op.
   * @see https://ledgerhq.atlassian.net/browse/BACK-10954
   */
  it("uses parent coin operation fee for token ops when explorer fee on token row differs", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    const address = "0x63f5c1b5a54a2423a0284b55ad6e48485e048e6a";
    const txHash = "0xdd046a625b9b4b1ec9c9eaabfa61869f74d9d744433dae3c7686432301713bb3";
    const parentFee = new BigNumber("119463100000000");
    const wrongTokenFee = new BigNumber("260429558000000");
    const someCoinOp: Operation = {
      id: "coin-out",
      accountId: "",
      type: "OUT",
      senders: [address],
      recipients: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
      value: new BigNumber("1080000000000000000"),
      hash: txHash,
      blockHeight: 99668817,
      blockHash: "0xee7f78727120c73888d3b41c0f5615af19838ee77f2ad974550a84fac307db09",
      fee: parentFee,
      date: new Date("2023-06-10T08:56:43.000Z"),
      transactionSequenceNumber: new BigNumber(0),
      extra: {},
    };
    const someTokenOp: Operation = {
      id: "token-in",
      accountId: "",
      type: "IN",
      senders: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
      recipients: [address],
      contract: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      value: new BigNumber("1080000000000000000"),
      hash: txHash,
      blockHeight: 99668817,
      blockHash: "0xee7f78727120c73888d3b41c0f5615af19838ee77f2ad974550a84fac307db09",
      fee: wrongTokenFee,
      date: new Date("2023-06-10T08:56:43.000Z"),
      transactionSequenceNumber: new BigNumber(0),
      extra: {},
    };

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [{ ...someCoinOp, fee: parentFee }],
      lastTokenOperations: [{ ...someTokenOp, fee: wrongTokenFee }],
      lastNftOperations: [],
      lastInternalOperations: [],
      nextPagingToken: "",
    });

    const { items } = await listOperations({} as CryptoCurrency, address, {
      minHeight: 0,
      order: "asc",
    });

    const sameTxFees = items
      .filter(op => op.tx.hash.toLowerCase() === txHash.toLowerCase())
      .map(op => op.tx.fees);

    const expectedTxFee = BigInt(parentFee.toFixed(0));
    expect(sameTxFees).toEqual([expectedTxFee, expectedTxFee]);
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
      nextPagingToken: "",
    });

    expect(
      await listOperations({} as CryptoCurrency, "address1", { minHeight: 1, order: "asc" }),
    ).toEqual({
      items: [
        {
          id: "coin-op-mixed-tx",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address2"],
          value: 1000000000000000000n,
          asset: { type: "native" },
          tx: {
            hash: "0xMixedTransactionHash",
            block: {
              height: 100,
              hash: "0xBlockHash",
              time: new Date("2025-02-20"),
            },
            fees: 21000000000000n,
            feesPayer: "address1",
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
            feesPayer: "address1",
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
      next: "",
    });
  });

  // here is the table of behavior for pagination:
  const paginationBehaviors: {
    limit: number | undefined;
    order: "asc" | "desc" | undefined;
    expectedExplorerOrder: "asc" | "desc";
    expectedResultOrder: "asc" | "desc";
  }[] = [
    // legacy behavior
    {
      limit: undefined,
      order: undefined,
      expectedExplorerOrder: "desc",
      expectedResultOrder: "desc",
    },
    { limit: undefined, order: "asc", expectedExplorerOrder: "desc", expectedResultOrder: "asc" },
    { limit: undefined, order: "desc", expectedExplorerOrder: "desc", expectedResultOrder: "desc" },
    // new behavior (limit is set)
    { limit: 10, order: "asc", expectedExplorerOrder: "asc", expectedResultOrder: "asc" },
    { limit: 10, order: "desc", expectedExplorerOrder: "desc", expectedResultOrder: "desc" },
    { limit: 10, order: undefined, expectedExplorerOrder: "desc", expectedResultOrder: "desc" },
  ];

  it.each(paginationBehaviors)(
    "etherscan explorer sort parameter is respected %s",
    async ({ limit, order, expectedExplorerOrder, expectedResultOrder }) => {
      setCoinConfig(
        () =>
          ({
            info: { explorer: { type: "etherscan" } },
          }) as unknown as EvmCoinConfig,
      );
      const getOperationsSpy = buildOperationsSpy(etherscanExplorer.explorerApi);
      const { items: result } = await listOperations(currency, address, {
        minHeight: 0,
        ...(limit !== undefined ? { limit } : {}),
        ...(order !== undefined ? { order } : {}),
      });
      expect(result.length).toBeGreaterThan(1);

      // check how the explorer is called
      const actualExplorerLimit = getOperationsSpy.mock.calls[0][6];
      expect(actualExplorerLimit).toBe(limit);
      const actualExplorerOrder = getOperationsSpy.mock.calls[0][7];
      expect(actualExplorerOrder).toBe(expectedExplorerOrder);

      // check the result order
      const firstOperation = result[0];
      const lastOperation = result[result.length - 1];
      if (expectedResultOrder === "asc") {
        expect(firstOperation.tx.date.getTime()).toBeLessThan(lastOperation.tx.date.getTime());
      } else {
        expect(firstOperation.tx.date.getTime()).toBeGreaterThan(lastOperation.tx.date.getTime());
      }
    },
  );

  it("should not enrich feePayer with ambiguous sender", async () => {
    const address = "address";
    const ambiguousParentSenders: Operation = {
      id: "coin-op-1",
      accountId: "",
      type: "IN",
      senders: [address, "address2"],
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
    };
    const relatedTokenOp: Operation = {
      ...ambiguousParentSenders, // inherit parent properties
      id: "token-op-1",
      accountId: "",
      type: "OUT",
      senders: ["token-op-sender"],
      recipients: [address], // address must be involved for op to pass isAddressInvolved filter
      contract: "contract-address",
      value: new BigNumber(1),
      extra: {},
    };
    const relatedInternalOp: Operation = {
      ...ambiguousParentSenders, // inherit parent properties
      id: "internal-op-1",
      accountId: "",
      type: "IN",
      senders: ["internal-op-sender"],
      recipients: [address], // address must be involved for op to pass isAddressInvolved filter
      value: new BigNumber(1),
      extra: {},
    };

    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [ambiguousParentSenders],
      lastTokenOperations: [relatedTokenOp],
      lastNftOperations: [],
      lastInternalOperations: [relatedInternalOp],
      nextPagingToken: "",
    });

    const { items: result } = await listOperations({} as CryptoCurrency, address, {
      minHeight: 1,
      order: "asc",
    });
    expect(result.map(op => ({ id: op.id, tx: { feesPayer: op.tx.feesPayer } }))).toEqual([
      { id: "coin-op-1", tx: { feesPayer: undefined } },
      { id: "token-op-1", tx: { feesPayer: undefined } },
      { id: "internal-op-1", tx: { feesPayer: undefined } },
    ]);
  });

  it("preserves semantic operation types (DELEGATE, NFT_*, etc.) instead of mapping to IN/OUT", async () => {
    const address = "0xdelegator";
    const stakingContract = "0xstaking";
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "delegate-op",
          accountId: "",
          type: "DELEGATE",
          senders: [address],
          recipients: [stakingContract],
          value: new BigNumber(100),
          hash: "0xdelegate-tx",
          blockHeight: 100,
          blockHash: "0xblock",
          fee: new BigNumber(1),
          date: new Date("2025-02-20"),
          transactionSequenceNumber: new BigNumber(1),
          hasFailed: false,
          extra: {},
        },
      ],
      lastTokenOperations: [],
      lastNftOperations: [],
      lastInternalOperations: [],
      nextPagingToken: "",
    });

    const { items } = await listOperations({} as CryptoCurrency, address, {
      minHeight: 0,
      order: "asc",
    });
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("DELEGATE");
    expect(items[0].senders[0]).toBe(address);
    expect(items[0].recipients[0]).toBe(stakingContract);
  });

  describe("Transaction to operation mapping should match the specification", () => {
    const blockHeight = 100;
    const blockHash = "0xblock";
    const date = new Date("2025-02-20");

    function mockGetOperations(
      response: {
        lastCoinOperations?: Array<{
          type: string;
          senders: string[];
          recipients: string[];
          value: number | string;
          fee: number | string;
          id?: string;
          hash?: string;
        }>;
        lastTokenOperations?: Array<{
          type: string;
          senders: string[];
          recipients: string[];
          value: number | string;
          contract: string;
          fee: number | string;
          id?: string;
          hash?: string;
        }>;
        lastInternalOperations?: Array<{
          type: string;
          senders: string[];
          recipients: string[];
          value: number | string;
          fee: number | string;
          id?: string;
          hash?: string;
        }>;
      },
      sharedHash?: string,
    ) {
      const operationTxHash = sharedHash ?? "0xsingle";
      const toBigNumber = (value: number | string) => new BigNumber(value);
      const coinOps = (response.lastCoinOperations ?? []).map((op, i) => ({
        id: `coin-op-${i}`,
        accountId: "",
        type: op.type,
        senders: op.senders,
        recipients: op.recipients,
        value: toBigNumber(op.value),
        hash: op.hash ?? operationTxHash,
        blockHeight,
        blockHash,
        fee: toBigNumber(op.fee),
        date,
        transactionSequenceNumber: new BigNumber(1),
        hasFailed: false,
        extra: {},
      }));
      const tokenOps = (response.lastTokenOperations ?? []).map((op, i) => ({
        id: `token-op-${i}`,
        accountId: "",
        type: op.type,
        senders: op.senders,
        recipients: op.recipients,
        contract: op.contract,
        value: toBigNumber(op.value),
        hash: op.hash ?? operationTxHash,
        blockHeight,
        blockHash,
        fee: toBigNumber(op.fee),
        date,
        transactionSequenceNumber: new BigNumber(1),
        extra: {},
      }));
      const internalOps = (response.lastInternalOperations ?? []).map((op, i) => ({
        id: `internal-op-${i}`,
        accountId: "",
        type: op.type,
        senders: op.senders,
        recipients: op.recipients,
        value: toBigNumber(op.value),
        hash: op.hash ?? operationTxHash,
        blockHeight,
        blockHash,
        fee: toBigNumber(op.fee),
        date,
        transactionSequenceNumber: new BigNumber(1),
        extra: {},
      }));
      return jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
        lastCoinOperations: coinOps as Operation[],
        lastTokenOperations: tokenOps as Operation[],
        lastNftOperations: [],
        lastInternalOperations: internalOps as Operation[],
        nextPagingToken: "",
      });
    }

    it("Case 1: simple native transfer between EOAs", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations({
        lastCoinOperations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["address2"],
            value: 2,
            fee: 1,
          },
        ],
      });

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 sees 1 op: sender=address1, recipient=address2, amount=2, asset=native, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(1);
      expect(address1Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 sees 1 op: sender=address1, recipient=address2, amount=2, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 2: native self send from EOA", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations({
        lastCoinOperations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["address1"],
            value: 2,
            fee: 1,
          },
        ],
      });

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: always 2 ops (OUT, IN, order not specified) for self-sends.
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      expect(result.items[1]).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 2: when explorer returns IN+OUT for self-send, still 2 ops", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations(
        {
          lastCoinOperations: [
            { type: "IN", senders: ["address1"], recipients: ["address1"], value: 2, fee: 1 },
            { type: "OUT", senders: ["address1"], recipients: ["address1"], value: 2, fee: 1 },
          ],
        },
        "0xselfsend",
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].type).toBe("IN");
      expect(result.items[1].type).toBe("OUT");
      expect(result.items[0]).toMatchObject({
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
      });
      expect(result.items[1]).toMatchObject({
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
      });
    });

    it("Case 3: simple ERC20 transfer between EOAs", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase3";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "FEES",
              senders: ["address1"],
              recipients: ["0xUSDTContract"],
              value: 0,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["address2"],
              value: 2,
              contract: "0xUSDTContract",
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 sees 1 op type=OUT, sender=address1, recipient=address2, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(1);
      expect(address1Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 sees 1 op type=IN, sender=address1, recipient=address2, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address2" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 4: ERC20 self send from EOA", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "FEES",
              senders: ["address1"],
              recipients: ["0xUSDTContract"],
              value: 0,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["address1"],
              value: 2,
              contract: "0xUSDTContract",
              fee: 1,
            },
          ],
        },
        "0xcase4",
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: always 2 ops (OUT, IN, order not specified) for token self-send.
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      expect(result.items[1]).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 5: ETH transfer from smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase5";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 0,
              fee: 1,
            },
          ],
          lastInternalOperations: [
            {
              type: "IN",
              senders: ["contract1"],
              recipients: ["address2"],
              value: 2,
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 1 op type=OUT, sender=address1, recipient=contract1, amount=0, asset=native, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(1);
      expect(address1Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 0n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 → 1 op type=IN, sender=contract1, recipient=address2, amount=2, asset=native, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["contract1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 6: ERC20 transfer from smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase6";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 0,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address3"],
              recipients: ["address2"],
              value: 2,
              contract: "0xUSDTContract",
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });
      const address3Result = await listOperations({} as CryptoCurrency, "address3", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 1 op type=OUT, sender=address1, recipient=contract1, amount=0, asset=native, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(1);
      expect(address1Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 0n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 → 1 op type=IN, sender=address3, recipient=address2, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["address3"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address2" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address3 → 1 op type=OUT, sender=address3, recipient=address2, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(address3Result.items).toHaveLength(1);
      expect(address3Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address3"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address3" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 7: ETH transfer to smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations({
        lastCoinOperations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: 2,
            fee: 1,
          },
        ],
      });

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: 1 op type=OUT, sender=address1, recipient=contract1, amount=2, asset=native, fee=1, feePayer=address1
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 8: ERC20 transfer to smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "FEES",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 0,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 2,
              contract: "0xUSDTContract",
              fee: 1,
            },
          ],
        },
        "0xcase8",
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: 1 op type=OUT, sender=address1, recipient=contract1, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 9: ETH transfer through smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase9";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 2,
              fee: 1,
            },
          ],
          lastInternalOperations: [
            {
              type: "IN",
              senders: ["contract1"],
              recipients: ["address2"],
              value: 2,
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 1 op type=OUT, sender=address1, recipient=contract1, amount=2, asset=ETH, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(1);
      expect(address1Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 → 1 op type=IN, sender=contract1, recipient=address2, amount=2, asset=ETH, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["contract1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 10: mixed assets smart contract interaction", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase10";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 1,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["address2"],
              value: 2,
              contract: "0xUSDTContract",
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 2 ops: (1) type=OUT address1→contract1, 1 ETH, fee=1; (2) type=OUT address1→address2, 2 USDT, fee=1, feePayer=address1
      expect(address1Result.items).toHaveLength(2);
      const nativeOp = address1Result.items.find(op => op.asset.type === "native");
      const tokenOp = address1Result.items.find(op => op.asset.type === "erc20");
      expect(nativeOp).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 1n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      expect(tokenOp).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec: address2 → 1 op type=IN, sender=address1, recipient=address2, amount=2, asset=USDT, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xUSDTContract", assetOwner: "address2" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case 11: Spoofed token transfer through smart contract", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase11";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "FEES",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 0,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "OUT",
              senders: ["address2"],
              recipients: ["address3"],
              value: 2,
              contract: "0xSCAMCOINContract",
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const address1Result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });
      const address2Result = await listOperations({} as CryptoCurrency, "address2", {
        minHeight: 0,
        order: "asc",
      });
      const address3Result = await listOperations({} as CryptoCurrency, "address3", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 1 or 2 ops (OUT and/or FEES), sender=address1, recipient=contract1, amount=0, fee=1
      expect(address1Result.items.length).toBeGreaterThanOrEqual(1);
      expect(address1Result.items.length).toBeLessThanOrEqual(2);
      const addr1Op = address1Result.items.find(
        o => o.senders[0] === "address1" && o.recipients[0] === "contract1",
      );
      expect(addr1Op).toMatchObject({
        senders: ["address1"],
        recipients: ["contract1"],
        value: 0n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      expect(["OUT", "FEES"]).toContain(addr1Op!.type);

      // Spec (spam not detected): address2 → 1 op type=OUT, sender=address2, recipient=address3, amount=2, asset=SCAMCOIN, fee=1, feePayer=address1
      expect(address2Result.items).toHaveLength(1);
      expect(address2Result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address2"],
        recipients: ["address3"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xSCAMCOINContract", assetOwner: "address2" },
        tx: { fees: 1n, feesPayer: "address1" },
      });

      // Spec (spam not detected): address3 → 1 op type=IN, sender=address2, recipient=address3, amount=2, asset=SCAMCOIN, fee=1, feePayer=address1
      expect(address3Result.items).toHaveLength(1);
      expect(address3Result.items[0]).toMatchObject({
        type: "IN",
        senders: ["address2"],
        recipients: ["address3"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xSCAMCOINContract", assetOwner: "address3" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });

    it("Case: root trace internal tx is deduplicated against parent coin op (Blockscout bug)", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xRootTraceBug";
      // Blockscout returns the top-level call as an internal tx with from=EOA.
      // Regular tx: user → router, value=6 (in txlist)
      // Internal tx: user → pool, value=6 (in txlistinternal — root trace, same from, same value)
      // Without dedup: native balance would be double-decremented.
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["router"],
              value: 6,
              fee: 1,
            },
          ],
          lastInternalOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["pool"],
              value: 6,
              fee: 0,
            },
          ],
        },
        sharedTxHash,
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Only the coin op should be emitted; the internal root trace is filtered out.
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["router"],
        value: 6n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      // The surviving op is a coin op, not an internal op.
      expect(result.items[0]!.details?.internal).toBeUndefined();
    });

    it("Case: root trace dedup is sender-based, filters even when internal value differs", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xRootTraceDiffValue";
      // Variant where the internal root trace has a different value than the coin op.
      // The filter is purely sender-based (not value-based), so it still deduplicates.
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["router"],
              value: 6,
              fee: 1,
            },
          ],
          lastInternalOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["pool"],
              value: 5,
              fee: 0,
            },
          ],
        },
        sharedTxHash,
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["router"],
        value: 6n,
        asset: { type: "native" },
      });
      expect(result.items[0]!.details?.internal).toBeUndefined();
    });

    it("Case: legitimate internal tx is NOT filtered when parent sender differs (smart contract wallet)", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xSCWCase";
      // A relayer sends a tx to the wallet (coin op), then the wallet makes a sub-call (internal tx).
      // The internal tx sender (wallet) matches the queried address, but the parent sender (relayer) differs.
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "FEES",
              senders: ["relayer"],
              recipients: ["address1"],
              value: 0,
              fee: 1,
            },
          ],
          lastInternalOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["target"],
              value: 3,
              fee: 0,
            },
          ],
        },
        sharedTxHash,
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Both ops should be present — the internal OUT is legitimate (smart contract wallet sub-call).
      const internalOp = result.items.find(op => op.details?.internal === true);
      expect(internalOp).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["target"],
        value: 3n,
        asset: { type: "native" },
      });
    });

    it("Case 12: Smart contract token minting", async () => {
      setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
      const sharedTxHash = "0xcase12";
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      mockGetOperations(
        {
          lastCoinOperations: [
            {
              type: "OUT",
              senders: ["address1"],
              recipients: ["contract1"],
              value: 1,
              fee: 1,
            },
          ],
          lastTokenOperations: [
            {
              type: "IN",
              senders: [zeroAddress],
              recipients: ["address1"],
              value: 2,
              contract: "0xSTETHContract",
              fee: 1,
            },
          ],
        },
        sharedTxHash,
      );

      const result = await listOperations({} as CryptoCurrency, "address1", {
        minHeight: 0,
        order: "asc",
      });

      // Spec: address1 → 2 ops: (1) type=OUT address1→contract1, 1 ETH, fee=1; (2) type=IN 0x0→address1, 2 STETH, fee=1, feePayer=address1
      expect(result.items).toHaveLength(2);
      const nativeOp = result.items.find(op => op.asset.type === "native");
      const tokenOp = result.items.find(op => op.asset.type === "erc20");
      expect(nativeOp).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 1n,
        asset: { type: "native" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
      expect(tokenOp).toMatchObject({
        type: "IN",
        senders: [zeroAddress],
        recipients: ["address1"],
        value: 2n,
        asset: { type: "erc20", assetReference: "0xSTETHContract", assetOwner: "address1" },
        tx: { fees: 1n, feesPayer: "address1" },
      });
    });
  });
});
