import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
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
    jest.clearAllMocks();
  });

  const buildOperationsSpy = (explorer: ExplorerApi) =>
    jest.spyOn(explorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-1",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: 4n,
          asset: { type: "native" as const },
          tx: {
            hash: "coin-op-1-tx-hash",
            block: { height: 10, hash: "coin-op-1-block-hash", time: new Date("2025-02-12") },
            fees: 20n,
            feesPayer: "address1",
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
          asset: { type: "native" as const },
          tx: {
            hash: "coin-op-2-tx-hash",
            block: { height: 20, hash: "coin-op-2-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            feesPayer: "address",
            date: new Date("2025-02-20"),
            failed: true,
          },
          details: { sequence: BigNumber(2) },
        },
        {
          id: "coin-op-3",
          type: "FEES",
          senders: ["address"],
          recipients: ["contract-address"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "token-op-1-tx-hash",
            block: { height: 20, hash: "coin-op-2-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            feesPayer: "address",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(3) },
        },
        {
          id: "coin-op-4",
          type: "NONE",
          senders: ["address1"],
          recipients: ["address2"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "token-op-2-tx-hash",
            block: { height: 20, hash: "coin-op-2-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            feesPayer: "address1",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(4) },
        },
        {
          id: "coin-op-5",
          type: "FEES",
          senders: ["address"],
          recipients: ["contract-address"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "token-op-3-tx-hash",
            block: { height: 20, hash: "coin-op-3-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            feesPayer: "address",
            date: new Date("2025-02-20"),
            failed: true,
          },
          details: { sequence: BigNumber(5) },
        },
        {
          id: "coin-op-6",
          type: "IN",
          senders: ["contract-address"],
          recipients: ["address"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "coin-op-6-tx-hash",
            block: { height: 20, hash: "coin-op-6-block-hash", time: new Date("2025-02-20") },
            fees: 15n,
            feesPayer: "contract-address",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(6) },
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-1",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          value: 1n,
          asset: {
            type: "erc20" as const,
            assetReference: "contract-address",
            assetOwner: "address",
          },
          tx: {
            hash: "token-op-1-tx-hash",
            block: { height: 20, hash: "token-op-1-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "1",
            assetSenders: ["address"],
            assetRecipients: ["address1"],
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
            type: "erc20" as const,
            assetReference: "contract-address",
            assetOwner: "address",
          },
          tx: {
            hash: "token-op-2-tx-hash",
            block: { height: 20, hash: "token-op-2-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "2",
            assetSenders: ["address"],
            assetRecipients: ["address2"],
            sequence: BigNumber(2),
          },
        },
        {
          id: "token-op-3",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          value: 1n,
          asset: {
            type: "erc20" as const,
            assetReference: "contract-address",
            assetOwner: "address",
          },
          tx: {
            hash: "token-op-3-tx-hash",
            block: { height: 20, hash: "token-op-3-block-hash", time: new Date("2025-02-20") },
            fees: 20n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "1",
            assetSenders: ["address"],
            assetRecipients: ["address1"],
            sequence: BigNumber(5),
          },
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [
        // Internal operation WITH matching parent coin operation (coin-op-5).
        // Should be enriched with parent's fee (20), feesPayer (address), and blockHash ("coin-op-3-block-hash").
        {
          id: "internal-op-1",
          type: "IN",
          senders: ["contract-address"],
          recipients: ["address"],
          value: 3n,
          asset: { type: "native" as const },
          tx: {
            hash: "token-op-3-tx-hash",
            block: { height: 20, hash: "token-op-3-block-hash", time: new Date("2025-02-20") },
            fees: 0n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { internal: true, sequence: BigNumber(5) },
        },
        // Internal operation WITH matching parent coin operation (coin-op-6).
        // Should be enriched with parent's fee (15) and blockHash ("coin-op-6-block-hash").
        {
          id: "internal-op-2",
          type: "IN",
          senders: ["contract-address"],
          recipients: ["address"],
          value: 5n,
          asset: { type: "native" as const },
          tx: {
            hash: "coin-op-6-tx-hash",
            block: { height: 20, hash: "token-op-3-block-hash", time: new Date("2025-02-20") },
            fees: 0n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { internal: true, sequence: BigNumber(6) },
        },
        // Internal operation with no matching parent coin operation.
        // This happens when the parent transaction was paid for by another
        // account (e.g., swapping to a fresh address via smart contract).
        // Should not be enriched with feesPayer (some-other-contract),
        {
          id: "internal-op-3",
          type: "IN",
          senders: ["some-other-contract"],
          recipients: ["address"],
          value: 7n,
          asset: { type: "native" as const },
          tx: {
            hash: "orphan-internal-tx-hash",
            block: { height: 25, hash: "", time: new Date("2025-02-25") },
            fees: 0n,
            date: new Date("2025-02-25"),
            failed: false,
          },
          details: { internal: true, sequence: BigNumber(7) },
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
          type: "OUT",
          senders: [address.toUpperCase()],
          recipients: ["address2"],
          value: 100n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xTxForAddress",
            block: { height: 100, hash: "0xBlockHash", time: new Date("2025-02-20") },
            fees: 10n,
            feesPayer: address.toUpperCase(),
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
        {
          id: "coin-op-unrelated",
          type: "OUT",
          senders: ["0xOtherA"],
          recipients: ["0xOtherB"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xTxUnrelated",
            block: { height: 101, hash: "0xBlockHash2", time: new Date("2025-02-20") },
            fees: 10n,
            feesPayer: "0xOtherA",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(2) },
        },
      ],
      lastTokenOperations: [],
      lastNftOperations: [],
      lastInternalOperations: [
        {
          id: "internal-op-unrelated",
          type: "IN",
          senders: ["0xOtherA"],
          recipients: ["0xOtherB"],
          value: 50n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xTxUnrelated",
            block: { height: 101, hash: "0xBlockHash2", time: new Date("2025-02-20") },
            fees: 0n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { internal: true, sequence: BigNumber(2) },
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

    const txHash = "0x4235dc16c74aecb248ad1005f3a0c82582a25afe797e62ecc8f4eed86ca628a1";
    const txFee = 21000000000000n;

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-erc20-tx",
          type: "FEES",
          senders: ["address1"],
          recipients: ["address2"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: txHash,
            block: {
              height: 279040,
              hash: "0x172b9bcb8f7d598227ab5f7f0ce",
              time: new Date("2025-02-20"),
            },
            fees: txFee,
            feesPayer: "address1",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-erc20",
          type: "OUT",
          senders: ["address1"],
          recipients: ["0xD656ab767968Fb3954cb1a16D525B540e1AfA00d"],
          value: 666n,
          asset: { type: "erc20" as const, assetReference: "address2", assetOwner: "address1" },
          tx: {
            hash: txHash,
            block: {
              height: 279040,
              hash: "0x172b9bcb8f7d598227ab5f7f0ce",
              time: new Date("2025-02-20"),
            },
            fees: txFee,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "666",
            assetSenders: ["address1"],
            assetRecipients: ["0xD656ab767968Fb3954cb1a16D525B540e1AfA00d"],
            sequence: BigNumber(1),
          },
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
          type: "OUT",
          senders: [recipient],
          recipients: ["0xOther"],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xOtherTxHash",
            block: { height: 100, hash: "0xBlockHash", time: new Date("2025-02-20") },
            fees: 1n,
            feesPayer: recipient,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-in",
          type: "IN",
          senders: [sender],
          recipients: [recipient],
          value: 100n,
          asset: { type: "erc20" as const, assetReference: "0xUSDT", assetOwner: recipient },
          tx: {
            hash: txHash,
            block: { height: 101, hash: "0xBlockHash2", time: new Date("2025-02-20") },
            fees: 0n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "IN",
            assetAmount: "100",
            assetSenders: [sender],
            assetRecipients: [recipient],
            sequence: BigNumber(2),
          },
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
    const parentFee = 119463100000000n;
    const wrongTokenFee = 260429558000000n;
    const block = {
      height: 99668817,
      hash: "0xee7f78727120c73888d3b41c0f5615af19838ee77f2ad974550a84fac307db09",
      time: new Date("2023-06-10T08:56:43.000Z"),
    };
    const someCoinOp: Operation<MemoNotSupported> = {
      id: "coin-out",
      type: "OUT",
      senders: [address],
      recipients: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
      value: 1080000000000000000n,
      asset: { type: "native" as const },
      tx: {
        hash: txHash,
        block,
        fees: parentFee,
        feesPayer: address,
        date: new Date("2023-06-10T08:56:43.000Z"),
        failed: false,
      },
      details: { sequence: BigNumber(0) },
    };
    const someTokenOp: Operation<MemoNotSupported> = {
      id: "token-in",
      type: "IN",
      senders: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
      recipients: [address],
      value: 1080000000000000000n,
      asset: {
        type: "erc20" as const,
        assetReference: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        assetOwner: address,
      },
      tx: {
        hash: txHash,
        block,
        fees: wrongTokenFee,
        date: new Date("2023-06-10T08:56:43.000Z"),
        failed: false,
      },
      details: {
        ledgerOpType: "IN",
        assetAmount: "1080000000000000000",
        assetSenders: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
        assetRecipients: [address],
        sequence: BigNumber(0),
      },
    };

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [someCoinOp],
      lastTokenOperations: [someTokenOp],
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

    expect(sameTxFees).toEqual([parentFee, parentFee]);
  });

  it("should emit both native and token operations when tx has native value > 0 and token transfers", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);

    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-mixed-tx",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address2"],
          value: 1000000000000000000n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xMixedTransactionHash",
            block: { height: 100, hash: "0xBlockHash", time: new Date("2025-02-20") },
            fees: 21000000000000n,
            feesPayer: "address1",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-mixed-tx",
          type: "OUT",
          senders: ["address1"],
          recipients: ["address3"],
          value: 500000000n,
          asset: {
            type: "erc20" as const,
            assetReference: "0xUSDCContract",
            assetOwner: "address1",
          },
          tx: {
            hash: "0xMixedTransactionHash",
            block: { height: 100, hash: "0xBlockHash", time: new Date("2025-02-20") },
            fees: 21000000000000n,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            ledgerOpType: "OUT",
            assetAmount: "500000000",
            assetSenders: ["address1"],
            assetRecipients: ["address3"],
            sequence: BigNumber(1),
          },
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
      const actualExplorerLimit = getOperationsSpy.mock.calls[0][5];
      expect(actualExplorerLimit).toBe(limit);
      const actualExplorerOrder = getOperationsSpy.mock.calls[0][6];
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
    const parentTx = {
      hash: "coin-op-1-tx-hash",
      block: { height: 10, hash: "coin-op-1-block-hash", time: new Date("2025-02-12") },
      fees: 20n,
      date: new Date("2025-02-12"),
      failed: false,
    };
    const ambiguousParentSenders: Operation<MemoNotSupported> = {
      id: "coin-op-1",
      type: "IN",
      senders: [address, "address2"],
      recipients: ["address"],
      value: 4n,
      asset: { type: "native" as const },
      tx: parentTx,
      details: { sequence: BigNumber(1) },
    };
    const relatedTokenOp: Operation<MemoNotSupported> = {
      id: "token-op-1",
      type: "OUT",
      senders: ["token-op-sender"],
      recipients: [address],
      value: 1n,
      asset: { type: "erc20" as const, assetReference: "contract-address", assetOwner: address },
      tx: parentTx,
      details: {
        ledgerOpType: "OUT",
        assetAmount: "1",
        assetSenders: ["token-op-sender"],
        assetRecipients: [address],
        sequence: BigNumber(1),
      },
    };
    const relatedInternalOp: Operation<MemoNotSupported> = {
      id: "internal-op-1",
      type: "IN",
      senders: ["internal-op-sender"],
      recipients: [address],
      value: 1n,
      asset: { type: "native" as const },
      tx: parentTx,
      details: { internal: true, sequence: BigNumber(1) },
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
          type: "DELEGATE",
          senders: [address],
          recipients: [stakingContract],
          value: 100n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xdelegate-tx",
            block: { height: 100, hash: "0xblock", time: new Date("2025-02-20") },
            fees: 1n,
            feesPayer: address,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
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

  it("preserves REWARD type for outbound claim-reward tx (not downgraded to OUT/FEES)", async () => {
    const address = "0xdelegator";
    const distributionPrecompile = "0x0000000000000000000000000000000000001007";
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "reward-op",
          type: "REWARD",
          senders: [address],
          recipients: [distributionPrecompile],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xreward-tx",
            block: { height: 100, hash: "0xblock", time: new Date("2025-02-20") },
            fees: 1n,
            feesPayer: address,
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: { sequence: BigNumber(1) },
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
    expect(items[0].type).toBe("REWARD");
  });

  it("copies smart contract fields from explorer extra into operation details", async () => {
    setCoinConfig(() => ({ info: { explorer: { type: "ledger" } } }) as unknown as EvmCoinConfig);
    const contractAddr = "0x1111111111111111111111111111111111111111";
    const payload = "0xabcd";
    jest.spyOn(ledgerExplorer, "getOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "sci-op",
          type: "OUT",
          senders: ["address"],
          recipients: [contractAddr],
          value: 0n,
          asset: { type: "native" as const },
          tx: {
            hash: "0xsci-hash",
            block: { height: 10, hash: "0xblock", time: new Date("2025-02-20") },
            fees: 1n,
            feesPayer: "address",
            date: new Date("2025-02-20"),
            failed: false,
          },
          details: {
            sequence: BigNumber(1),
            contractInteraction: "SmartContractInteraction",
            contractAddress: contractAddr,
            contractPayload: payload,
          },
        },
      ],
      lastTokenOperations: [],
      lastNftOperations: [],
      lastInternalOperations: [],
      nextPagingToken: "",
    });

    const { items } = await listOperations({} as CryptoCurrency, "address", {
      minHeight: 1,
      order: "asc",
    });

    expect(items[0].details).toEqual({
      sequence: BigNumber(1),
      contractInteraction: "SmartContractInteraction",
      contractAddress: contractAddr,
      contractPayload: payload,
    });
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
      const toBigInt = (value: number | string) => BigInt(value);
      // Real adapters compute type relative to the queried address. Simulate that here so tests
      // that call listOperations with different addresses get the correct perspective type.
      const typeFromPerspective = (
        type: string,
        senders: string[],
        recipients: string[],
        queriedAddr: string,
      ): string => {
        const addr = queriedAddr.toLowerCase();
        const isIn = recipients.some(r => r.toLowerCase() === addr);
        const isOut = senders.some(s => s.toLowerCase() === addr);
        if (isIn && isOut) return type; // self-send: keep the type the caller specified
        if (isIn) return "IN";
        if (isOut) return type;
        return "NONE";
      };
      return jest
        .spyOn(ledgerExplorer, "getOperations")
        .mockImplementation(async (_currency, queriedAddress) => {
          const coinOps: Array<Operation<MemoNotSupported>> = (
            response.lastCoinOperations ?? []
          ).map((op, i) => ({
            id: op.id ?? `coin-op-${i}`,
            type: typeFromPerspective(op.type, op.senders, op.recipients, queriedAddress),
            senders: op.senders,
            recipients: op.recipients,
            value: toBigInt(op.value),
            asset: { type: "native" as const },
            tx: {
              hash: op.hash ?? operationTxHash,
              block: { height: blockHeight, hash: blockHash, time: date },
              fees: toBigInt(op.fee),
              ...(op.senders.length === 1 ? { feesPayer: op.senders[0] } : {}),
              date,
              failed: false,
            },
            details: { sequence: BigNumber(1) },
          }));
          const tokenOps: Array<Operation<MemoNotSupported>> = (
            response.lastTokenOperations ?? []
          ).map((op, i) => ({
            id: op.id ?? `token-op-${i}`,
            type: typeFromPerspective(op.type, op.senders, op.recipients, queriedAddress),
            senders: op.senders,
            recipients: op.recipients,
            value: toBigInt(op.value),
            asset: {
              type: "erc20" as const,
              assetReference: op.contract,
              assetOwner: queriedAddress,
            },
            tx: {
              hash: op.hash ?? operationTxHash,
              block: { height: blockHeight, hash: blockHash, time: date },
              fees: toBigInt(op.fee),
              date,
              failed: false,
            },
            details: {
              ledgerOpType: op.type,
              assetAmount: String(op.value),
              assetSenders: op.senders,
              assetRecipients: op.recipients,
              sequence: BigNumber(1),
            },
          }));
          const internalOps: Array<Operation<MemoNotSupported>> = (
            response.lastInternalOperations ?? []
          ).map((op, i) => ({
            id: op.id ?? `internal-op-${i}`,
            type: op.type,
            senders: op.senders,
            recipients: op.recipients,
            value: toBigInt(op.value),
            asset: { type: "native" as const },
            tx: {
              hash: op.hash ?? operationTxHash,
              block: { height: blockHeight, hash: blockHash, time: date },
              fees: toBigInt(op.fee),
              date,
              failed: false,
            },
            details: { internal: true, sequence: BigNumber(1) },
          }));
          return {
            lastCoinOperations: coinOps,
            lastTokenOperations: tokenOps,
            lastNftOperations: [],
            lastInternalOperations: internalOps,
            nextPagingToken: "",
          };
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
