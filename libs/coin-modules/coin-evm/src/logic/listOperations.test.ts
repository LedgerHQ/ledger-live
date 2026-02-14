import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
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
    jest.restoreAllMocks();
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
        // Should be enriched with parent's fee (15) and blockHash ("coin-op-6-block-hash").
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
            type: "FEES",
            senders: ["address"],
            recipients: ["address1"],
            value: 0n,
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
            type: "NONE",
            senders: ["address"],
            recipients: ["address2"],
            value: 0n,
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
            type: "FEES",
            senders: ["address"],
            recipients: ["address1"],
            value: 0n,
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
        next: undefined,
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

  // here is the table of behavior:
  const behaviors = [
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

  it.each(behaviors)(
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
        limit,
        order,
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
});
