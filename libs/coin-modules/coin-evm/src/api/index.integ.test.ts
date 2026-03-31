import {
  AlpacaApi,
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  Operation,
  StakingTransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { ethers } from "ethers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe.each([
  [
    "external node and explorer",
    {
      node: { type: "external", uri: "https://ethereum-rpc.publicnode.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1",
      },
      showNfts: true,
    },
  ],
  [
    "ledger node and explorer",
    {
      node: { type: "ledger", explorerId: "eth" },
      explorer: {
        type: "ledger",
        explorerId: "eth",
      },
      showNfts: true,
    },
  ],
])("EVM Api (%s)", (_, config) => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
    module = createApi(config as EvmConfig, "ethereum");
  });

  describe("getNextSequence", () => {
    it("returns 0 as next sequence for a pristine account", async () => {
      expect(await module.getNextSequence("0x6895Df5ed013c85B3D9D2446c227C9AfC3813551")).toEqual(
        0n,
      );
    });

    it("returns next sequence for an address", async () => {
      expect(
        await module.getNextSequence("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1"),
      ).toBeGreaterThanOrEqual(17n);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await module.lastBlock();

      expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info for a specific height", async () => {
      const lastBlock = await module.lastBlock();
      const result = await module.getBlockInfo(lastBlock.height);

      expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.height).toBe(lastBlock.height);
      expect(result.time).toBeInstanceOf(Date);
    });

    it("returns block info for an older block", async () => {
      const result = await module.getBlockInfo(20000000);

      expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.height).toBe(20000000);
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time!.getTime()).toBeLessThan(Date.now());
    });

    it("returns block info with parent for a block with height > 0", async () => {
      const result = await module.getBlockInfo(20000000);

      expect(result.parent?.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.parent?.height).toBe(19999999);
      expect(result.parent?.height).toBe(result.height - 1);
    });

    it("returns block info without parent for genesis block", async () => {
      const result = await module.getBlockInfo(0);

      expect(result.height).toBe(0);
      expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
      expect(result.parent).toBeUndefined();
    });

    it("ensures parent block structure is correct", async () => {
      const result = await module.getBlockInfo(20000000);

      if (result.parent) {
        expect(result.parent.height).toBeGreaterThanOrEqual(0);
        expect(result.parent.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
        expect(result.parent.height).toBe(result.height - 1);
      }
    });
  });

  describe("getBlock", () => {
    it("returns block with transactions for a specific height", async () => {
      const lastBlock = await module.lastBlock();
      const result = await module.getBlock(lastBlock.height);

      expect(result.info.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.info.height).toBe(lastBlock.height);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.transactions).toBeInstanceOf(Array);
      result.transactions.forEach(tx => {
        expect(tx.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
        expect(typeof tx.failed).toBe("boolean");
        expect(tx.operations).toBeInstanceOf(Array);
        expect(tx.fees).toBeGreaterThanOrEqual(0n);
        expect(tx.feesPayer).toMatch(/^0x[A-Fa-f0-9]{40}$/);
        tx.operations.forEach(op => {
          expect(op.type).toBe("transfer");
          expect(op.address).toMatch(/^0x[A-Fa-f0-9]{40}$/);
          expect(op.asset).toEqual(expect.objectContaining({ type: expect.any(String) }));
          expect(typeof op.amount).toBe("bigint");
        });
      });
    });

    it("returns block with transactions for an older block", async () => {
      const result = await module.getBlock(20000000);

      expect(result.info.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.info.height).toBe(20000000);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.info.time!.getTime()).toBeLessThan(Date.now());
      expect(result.transactions).toBeInstanceOf(Array);
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it("returns block with parent for a block with height > 0", async () => {
      const result = await module.getBlock(20000000);

      expect(result.info.parent?.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.info.parent?.height).toBe(19999999);
      expect(result.info.parent?.height).toBe(result.info.height - 1);
    });

    it("returns block without parent for genesis block", async () => {
      const result = await module.getBlock(0);

      expect(result.info.height).toBe(0);
      expect(result.info.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.info.parent).toBeUndefined();
    });

    it("returns block with operations extracted from transactions", async () => {
      const result = await module.getBlock(20000000);

      // Check that at least some transactions have operations
      const transactionsWithOps = result.transactions.filter(tx => tx.operations.length > 0);
      expect(transactionsWithOps.length).toBeGreaterThan(0);

      // Verify operation structure
      transactionsWithOps.forEach(tx => {
        tx.operations.forEach(op => {
          expect(op).toHaveProperty("type", "transfer");
          expect(op).toHaveProperty("address");
          expect(op).toHaveProperty("asset");
          expect(op).toHaveProperty("amount");
          if (op.peer) {
            expect(op.peer).toMatch(/^0x[A-Fa-f0-9]{40}$/);
          }
        });
      });
    });
  });

  describe.each([
    [
      "legacy",
      (transaction: ethers.Transaction): void => {
        expect(transaction.type).toBe(0);
        expect(typeof transaction.gasPrice).toBe("bigint");
        expect(transaction.gasPrice).toBeGreaterThan(0);
      },
    ],
    [
      "eip1559",
      (transaction: ethers.Transaction): void => {
        expect(transaction.type).toBe(2);
        expect(transaction.gasPrice).toBeNull();
        expect(typeof transaction.maxFeePerGas).toBe("bigint");
        expect(typeof transaction.maxPriorityFeePerGas).toBe("bigint");
        expect(transaction.maxFeePerGas).toBeGreaterThan(0n);
        expect(transaction.maxPriorityFeePerGas).toBeGreaterThan(0n);
      },
    ],
  ])("craftTransaction", (mode, expectTransactionForMode) => {
    it("crafts a transaction with the native asset", async () => {
      const { transaction: result } = await module.craftTransaction({
        type: `send-${mode}`,
        intentType: "transaction",
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "native",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]+$/);
      expect(ethers.Transaction.from(result)).toMatchObject({
        value: 10n,
        to: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      });
      expectTransactionForMode(ethers.Transaction.from(result));
    });

    it("crafts a transaction with the USDC asset", async () => {
      const { transaction: result } = await module.craftTransaction({
        type: `send-${mode}`,
        intentType: "transaction",
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "erc20",
          assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]+$/);
      expect(ethers.Transaction.from(result)).toMatchObject({
        value: 0n,
        to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      });
      expectTransactionForMode(ethers.Transaction.from(result));
    });
  });

  describe("getBalance", () => {
    it("returns empty balance for a pristine account", async () => {
      const result = await module.getBalance("0x6895Df5ed013c85B3D9D2446c227C9AfC3813551");

      expect(result).toEqual([
        {
          value: 0n,
          asset: { type: "native" },
        },
      ]);
    });

    it("returns 0 when address is not found", async () => {
      const result = await module.getBalance("0xcafebabe00000000000000000000000000000000");

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });

    it("returns balance for an address", async () => {
      const result = await module.getBalance("0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3");

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toEqual({
        value: expect.any(BigInt),
        asset: { type: "native" },
      });
      expect(result[0].value).toBeGreaterThan(0);
      result.slice(1).forEach(balance => {
        expect(balance.asset.type).not.toEqual("native");
        expect(balance.value).toBeGreaterThanOrEqual(0);
      });
    });

    /**
     * Ensure non regression and avoid
     * "To send batches over 10 items, consider using a dedicated API provider"
     */
    it("returns at least 10 token balances on Optimisim", async () => {
      const module = createApi(
        {
          node: {
            type: "external",
            uri: "https://mainnet.optimism.io",
          },
          explorer: {
            type: "blockscout",
            uri: "https://optimism.blockscout.com/api",
          },
        } as EvmConfig,
        "optimism",
      );

      const result = await module.getBalance("0x1CDDb825910426644e00e769072Ce1Ea7d4e34BB");

      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe("listOperations", () => {
    it("returns empty operation list for a pristine account", async () => {
      expect(
        await module.listOperations("0x6895Df5ed013c85B3D9D2446c227C9AfC3813551", {
          minHeight: 200,
          order: "asc",
        }),
      ).toEqual({ items: [], next: "" });
    });

    it.each([
      [
        "an ascending",
        "asc",
        (operations: Operation[]): boolean =>
          operations.every((op, i) => i === 0 || op.tx.date >= operations[i - 1].tx.date),
      ],
      [
        "a descending",
        "desc",
        (operations: Operation[]): boolean =>
          operations.every((op, i) => i === 0 || op.tx.date <= operations[i - 1].tx.date),
      ],
    ] as const)(
      "lists operations for an address with %s order",
      async (_s, order, isCorrectlyOrdered) => {
        const { items: result } = await module.listOperations(
          "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1",
          { minHeight: 200, order },
        );
        expect(result.length).toBeGreaterThanOrEqual(52);
        result.forEach(op => {
          expect([
            "NONE",
            "FEES",
            "IN",
            "OUT",
            "DELEGATE",
            "UNDELEGATE",
            "REDELEGATE",
            "NFT_IN",
            "NFT_OUT",
          ]).toContainEqual(op.type);
          expect(op.senders.concat(op.recipients)).toContain(
            "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1",
          );
          expect(op.value).toBeGreaterThanOrEqual(0n);
          expect(op.tx.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
          expect(op.tx.block.hash).toMatch(/^(|0x[A-Fa-f0-9]{64})$/); // block hash not available for all internal transactions
          expect(op.tx.block.height).toBeGreaterThanOrEqual(200);
          expect(op.tx.fees).toBeGreaterThanOrEqual(0n); // fees not available for all internal transactions
          expect(op.tx.date).toBeInstanceOf(Date);
        });
        expect(isCorrectlyOrdered(result));
      },
    );

    const isEtherscanLike = (config as EvmConfig).explorer?.type === "etherscan";

    describe("pagination", () => {
      let oldNftCurrencies: string[];

      beforeAll(() => {
        // Disable NFT fetching to speed up pagination tests
        oldNftCurrencies = getEnv("NFT_CURRENCIES");
        setEnv("NFT_CURRENCIES", []);
      });

      afterAll(() => {
        setEnv("NFT_CURRENCIES", oldNftCurrencies);
      });

      const expectUniqueOperationIds = (ops: Operation[]) => {
        const operationIds = ops.map(op => op.id);
        const uniqueOperationIds = new Set(operationIds);
        expect(uniqueOperationIds.size).toBe(operationIds.length);
      };

      const isOrdered = (ops: Operation[], order: "asc" | "desc") => {
        return ops.every((op, i) => {
          if (i === 0) return true;
          const prevDate = ops[i - 1].tx.date.getTime();
          const currDate = op.tx.date.getTime();
          return order === "desc" ? currDate <= prevDate : currDate >= prevDate;
        });
      };

      // TODO implement pagination for ledger explorer
      // Pagination tests only make sense for etherscan-like explorers that support real pagination.
      // Ledger explorer fetches all data in one call looping over all the pages and returns NO_TOKEN.
      (isEtherscanLike ? it.each : it.skip.each)([
        // note that the ASC mode is really slow
        ["ascending", "asc"],
        ["descending", "desc"],
      ] as const)("paginates operations in %s order across multiple pages", async (_, order) => {
        const address = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";
        const limit = 100;

        // -- Page 1

        const { items: p1Ops, next: p1Token } = await module.listOperations(address, {
          minHeight: 200,
          order,
          limit,
        });
        const p1NbOps = p1Ops.length;

        expect(p1NbOps).toBeGreaterThanOrEqual(limit);
        expect(p1Token).toMatch(/^[0-9]+-[0-1]{4}$/);
        expectUniqueOperationIds(p1Ops);
        expect(isOrdered(p1Ops, order)).toBe(true);

        // -- Page 2

        const { items: p2Ops, next: p2Token } = await module.listOperations(address, {
          minHeight: 200,
          order,
          limit,
          ...(p1Token ? { cursor: p1Token } : {}),
        });
        const p2NbOps = p2Ops.length;

        expect(p2NbOps).toBeGreaterThanOrEqual(limit);
        expect(p2Token).toMatch(/^[0-9]+-[0-1]{4}$/);
        expectUniqueOperationIds(p2Ops);
        expect(isOrdered(p2Ops, order)).toBe(true);

        // -- Properties assertion

        const allOps = [...p1Ops, ...p2Ops];

        // check that each page has no height bounds in common
        expect(p1Ops[0]).not.toBe(p2Ops[p2NbOps - 1]);
        expect(p1Ops[p1NbOps - 1]).not.toBe(p2Ops[0]);

        // Check no page overlapping
        const p1Heights = new Set(p1Ops.map(op => op.tx.block.height));
        const p2Heights = new Set(p2Ops.map(op => op.tx.block.height));
        const p1p2IntersectionSize = [...p1Heights].filter(height => p2Heights.has(height)).length;
        expect(p1p2IntersectionSize).toBe(0);

        // Check no duplicate operation ids
        expectUniqueOperationIds(allOps);

        // check total ordering across pages
        expect(isOrdered(allOps, order)).toBe(true);
      });

      // Cache test only makes sense for etherscan-like explorers that have
      // pagination parameters affecting cache keys.
      // Note: We only verify functional behavior (different params = different results),
      // not timing, as timing-based tests are inherently flaky in integration tests.
      (isEtherscanLike ? it : it.skip)("cache key includes pagination parameters", async () => {
        const address = "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1";

        // First call
        const { items: firstCallResult, next: firstCallToken } = await module.listOperations(
          address,
          {
            minHeight: 200,
            order: "desc",
            limit: 5,
          },
        );

        // Same call again - should return same result (cached or not)
        const { items: cachedResult } = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 5,
        });

        // Different limit - should return different results
        const { items: greaterLimitResult } = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 10,
        });

        // Different order - should return different results
        const { items: differentOrderResult } = await module.listOperations(address, {
          minHeight: 200,
          order: "asc",
          limit: 5,
        });

        // Different pagingToken - should return different results
        const { items: differentTokenResult } = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 5,
          ...(firstCallToken ? { cursor: firstCallToken } : {}),
        });

        // Same parameters should return same results
        expect(cachedResult.map(op => op.id)).toEqual(firstCallResult.map(op => op.id));

        // Greater limit may return more operations
        expect(firstCallResult.length).toBeLessThanOrEqual(greaterLimitResult.length);

        // Different order should return operations in different order (desc has newer first)
        if (firstCallResult.length > 0 && differentOrderResult.length > 0) {
          expect(firstCallResult[0]?.tx.date.getTime()).toBeGreaterThanOrEqual(
            differentOrderResult[0]?.tx.date.getTime(),
          );
        }

        // Different pagingToken should return different operations (next page)
        if (firstCallToken && differentTokenResult.length > 0) {
          // The token result should not overlap with the first page
          const firstPageIds = new Set(firstCallResult.map(op => op.id));
          const hasOverlap = differentTokenResult.some(op => firstPageIds.has(op.id));
          expect(hasOverlap).toBe(false);
        }
      });
    });

    describe("transactions non-regression", () => {
      const opsForTx = (items: Operation[], txHash: string) =>
        items.filter(op => op.tx.hash.toLowerCase() === txHash.toLowerCase());

      const expectAddressEq = (actual: string, expected: string) =>
        expect(actual.toLowerCase()).toBe(expected.toLowerCase());

      it("simple native transfer between EOAs", async () => {
        const txHash = "0x9f555da0bb8d9ff99ced6db6e5f966699f8df849f4887c80ed44ffb101f7d252";
        const blockHeight = 24600494;
        const sender = "0x12644b85A2F20F39Ade7543FBA1C0C9DFE289580";
        const recipient = "0xD017e1a34648521E7959F0AfDb5d359c979f5E2f";

        const { items: senderOps } = await module.listOperations(sender, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });
        const { items: recipientOps } = await module.listOperations(recipient, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });

        const senderTxOps = opsForTx(senderOps, txHash);
        const recipientTxOps = opsForTx(recipientOps, txHash);

        expect(senderTxOps).toHaveLength(1);
        expect(senderTxOps[0]).toMatchObject({
          type: "OUT",
          asset: { type: "native" },
          tx: { feesPayer: expect.any(String) },
        });
        expectAddressEq(senderTxOps[0].senders[0], sender);
        expectAddressEq(senderTxOps[0].recipients[0], recipient);
        expectAddressEq(senderTxOps[0].tx.feesPayer!, sender);
        expect(senderTxOps[0].value).toBeGreaterThan(0n);
        expect(senderTxOps[0].tx.fees).toBeGreaterThan(0n);

        expect(recipientTxOps).toHaveLength(1);
        expect(recipientTxOps[0]).toMatchObject({
          type: "IN",
          asset: { type: "native" },
          tx: { feesPayer: expect.any(String) },
        });
        expectAddressEq(recipientTxOps[0].senders[0], sender);
        expectAddressEq(recipientTxOps[0].recipients[0], recipient);
        expectAddressEq(recipientTxOps[0].tx.feesPayer!, sender);
        expect(recipientTxOps[0].value).toBe(senderTxOps[0].value);
      });

      it("simple ERC20 transfer between EOAs", async () => {
        const txHash = "0xbbe8faac0666fb9741c536a1fcb184dc81884c95a38dcff899328a3c6c7c05b9";
        const blockHeight = 24676233;
        const sender = "0xf764Af5afc8dbfa0e698aBB8Eeb3E5a79c0cE4B5";
        const recipient = "0x1f2F2d487C79822dc59550d87Bd5B32234F6F387";
        const contract = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

        const { items: senderOps } = await module.listOperations(sender, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });
        const { items: recipientOps } = await module.listOperations(recipient, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });

        const senderTxOps = opsForTx(senderOps, txHash);
        const recipientTxOps = opsForTx(recipientOps, txHash);

        expect(senderTxOps).toHaveLength(1);
        expect(senderTxOps[0]).toMatchObject({
          type: "OUT",
          asset: { type: "erc20" },
          tx: { feesPayer: expect.any(String) },
        });
        const senderAsset = senderTxOps[0].asset as {
          assetReference?: string;
          assetOwner?: string;
        };
        expect(senderAsset.assetReference?.toLowerCase()).toBe(contract.toLowerCase());
        expectAddressEq(senderTxOps[0].senders[0], sender);
        expectAddressEq(senderTxOps[0].recipients[0], recipient);
        expectAddressEq(senderAsset.assetOwner!, sender);
        expectAddressEq(senderTxOps[0].tx.feesPayer!, sender);
        expect(senderTxOps[0].value).toBeGreaterThan(0n);

        expect(recipientTxOps).toHaveLength(1);
        expect(recipientTxOps[0]).toMatchObject({
          type: "IN",
          asset: { type: "erc20" },
        });
        const recipientAsset = recipientTxOps[0].asset as {
          assetReference?: string;
          assetOwner?: string;
        };
        expect(recipientAsset.assetReference?.toLowerCase()).toBe(contract.toLowerCase());
        expectAddressEq(recipientTxOps[0].senders[0], sender);
        expectAddressEq(recipientTxOps[0].recipients[0], recipient);
        expectAddressEq(recipientAsset.assetOwner!, recipient);
        expect(recipientTxOps[0].value).toBe(senderTxOps[0].value);
      });

      it("Lido deposit (ETH to contract + STETH mint to sender)", async () => {
        const txHash = "0x5b4fc90367ca30d5c790ae394d9d177db4f91cfb52d627e8fa94379c16ac5724";
        const blockHeight = 24535189;
        const sender = "0xf88e9863b2c157cdeaab3e3401be6b2d583bdfbd";
        const lidoContract = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";
        const zeroAddress = "0x0000000000000000000000000000000000000000";

        const { items } = await module.listOperations(sender, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });
        const txOps = opsForTx(items, txHash);

        expect(txOps.length).toBeGreaterThanOrEqual(2);
        const nativeOp = txOps.find(op => op.asset.type === "native");
        const tokenOp = txOps.find(
          op =>
            op.asset.type === "erc20" &&
            op.asset.assetReference?.toLowerCase() === lidoContract.toLowerCase(),
        );

        expect(nativeOp).toMatchObject({
          type: "OUT",
          asset: { type: "native" },
          tx: { feesPayer: expect.any(String) },
        });
        expectAddressEq(nativeOp!.senders[0], sender);
        expectAddressEq(nativeOp!.recipients[0], lidoContract);
        expectAddressEq(nativeOp!.tx.feesPayer!, sender);
        expect(nativeOp!.value).toBeGreaterThan(0n);

        expect(tokenOp).toMatchObject({
          type: "IN",
          asset: { type: "erc20", assetOwner: expect.any(String) },
          tx: { feesPayer: expect.any(String) },
        });
        const tokenOpAsset = tokenOp!.asset as { assetReference?: string; assetOwner?: string };
        expect(tokenOpAsset.assetReference?.toLowerCase()).toBe(lidoContract.toLowerCase());
        expectAddressEq(tokenOpAsset.assetOwner!, sender);
        expect(tokenOp!.senders[0].toLowerCase()).toBe(zeroAddress.toLowerCase());
        expectAddressEq(tokenOp!.recipients[0], sender);
        expectAddressEq(tokenOp!.tx.feesPayer!, sender);
        expect(tokenOp!.value).toBeGreaterThan(0n);
      });

      it("Spoofed NFT transfer through smart contract", async () => {
        const txHash = "0x61adea29cbf2e50f9ab975636af9a624620589c2cca9b8dc82ccccaefeb9c6ad";
        const blockHeight = 21348730;
        const caller = "0x6b2ae7cc19eda092476f32cced9311da568a823c";
        const spoofedSender = "0x7d75Acd9B52e01B149557ed230717ECd088b898a";

        const { items: spoofedSenderOps } = await module.listOperations(spoofedSender, {
          minHeight: blockHeight,
          order: "asc",
          limit: 50,
        });
        const txOpsSpoofedSender = opsForTx(spoofedSenderOps, txHash);

        expect(txOpsSpoofedSender).toHaveLength(1);
        expect(txOpsSpoofedSender[0]).toMatchObject({
          type: "NFT_OUT",
          senders: expect.any(Array),
          recipients: expect.any(Array),
          asset: { type: "erc1155" },
        });
        expectAddressEq(txOpsSpoofedSender[0].senders[0], spoofedSender);
        // feesPayer is caller when the explorer returns the parent coin op; undefined when it does not (e.g. Ledger when querying by spoofed sender).
        const feesPayer = txOpsSpoofedSender[0].tx.feesPayer;
        if (feesPayer !== undefined) {
          expectAddressEq(feesPayer, caller);
        }
        expect(txOpsSpoofedSender[0].value).toBeGreaterThan(0n);
      });
    });
  });

  describe.each([
    [
      "legacy",
      (estimation: FeeEstimation): void => {
        expect(estimation).toEqual({
          value: expect.any(BigInt),
          parameters: {
            gasPrice: expect.any(BigInt),
            gasLimit: expect.any(BigInt),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
            type: 0,
          },
        });
        expect(estimation.value).toBeGreaterThan(0);
        expect(estimation.parameters?.gasPrice).toBeGreaterThan(0);
      },
    ],
    [
      "eip1559",
      (estimation: FeeEstimation): void => {
        expect(estimation).toEqual({
          value: expect.any(BigInt),
          parameters: {
            gasPrice: null,
            gasLimit: expect.any(BigInt),
            maxFeePerGas: expect.any(BigInt),
            maxPriorityFeePerGas: expect.any(BigInt),
            nextBaseFee: expect.any(BigInt),
            type: 2,
          },
        });
        expect(estimation.value).toBeGreaterThan(0);
        expect(estimation.parameters?.maxFeePerGas).toBeGreaterThan(0);
        expect(estimation.parameters?.maxPriorityFeePerGas).toBeGreaterThan(0);
        expect(estimation.parameters?.nextBaseFee).toBeGreaterThan(0);
      },
    ],
  ])("estimateFees for %s transaction", (mode, expectEstimationForMode) => {
    it("estimates fees for native asset transfer", async () => {
      const result = await module.estimateFees({
        type: `send-${mode}`,
        intentType: "transaction",
        amount: 100000000000000n, // 0.0001 ETH (smaller amount)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "native",
        },
      });

      expectEstimationForMode(result);
    });

    it("estimates fees for USDC token transfer", async () => {
      const result = await module.estimateFees({
        type: `send-${mode}`,
        intentType: "transaction",
        amount: 1000000n, // 1 USDC (6 decimals)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "erc20",
          assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expectEstimationForMode(result);
    });
  });
});

describe("EVM Api (Moonbeam Network)", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    module = createApi(
      {
        node: { type: "external", uri: "https://rpc.api.moonbeam.network" },
        explorer: {
          type: "etherscan",
          uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1284",
        },
        showNfts: false,
      } as EvmConfig,
      "moonbeam",
    );
  });

  describe("listOperations", () => {
    /**
     * Non-regression: some Moonbeam transactions (e.g. contract creations) have
     * an empty `to` field in the Etherscan API response. The adapter used to emit
     * `recipients: [""]` (array with one empty string) instead of `recipients: []`.
     * @see https://alpaca.api.ledger.com/v1/moonbeam/account/0x2a9c55b6dc56da178f9f9a566f1161237b73ba66/operations?limit=100
     */
    it("returns no operations with empty string recipients or senders", async () => {
      const { items } = await module.listOperations("0x2a9c55b6dc56da178f9f9a566f1161237b73ba66", {
        minHeight: 0,
        order: "desc",
        limit: 100,
      });

      expect(items.length).toBeGreaterThan(0);
      items.forEach(op => {
        op.recipients.forEach(r => {
          expect(r).not.toBe("");
        });
        op.senders.forEach(s => {
          expect(s).not.toBe("");
        });
      });
    });
  });
});

describe("EVM Api (SEI Network)", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://sei-evm-rpc.publicnode.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1329",
      },
    };
    module = createApi(config as EvmConfig, "sei_evm");
  });

  describe.each([
    [
      "legacy",
      (transaction: ethers.Transaction): void => {
        expect(transaction.type).toBe(0);
        expect(typeof transaction.gasPrice).toBe("bigint");
        expect(transaction.gasPrice).toBeGreaterThan(0);
      },
    ],
    [
      "eip1559",
      (transaction: ethers.Transaction): void => {
        expect(transaction.type).toBe(2);
        expect(transaction.gasPrice).toBeNull();
        expect(typeof transaction.maxFeePerGas).toBe("bigint");
        expect(typeof transaction.maxPriorityFeePerGas).toBe("bigint");
        expect(transaction.maxFeePerGas).toBeGreaterThan(0n);
        expect(transaction.maxPriorityFeePerGas).toBeGreaterThan(0n);
      },
    ],
  ])("craftTransaction", (mode, expectTransactionForMode) => {
    it("crafts a delegate transaction", async () => {
      const { transaction: result } = await module.craftTransaction({
        type: `staking-${mode}`,
        intentType: "staking" as const,
        amount: 1000000000000000000n, // 1 SEI
        mode: "delegate",
        sender: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        recipient: "0x0000000000000000000000000000000000001005",
        valAddress: "seivaloper1ummny4p645xraxc4m7nphf7vxawfzt3p5hn47t",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "native",
        },
      } as StakingTransactionIntent<MemoNotSupported, BufferTxData>);

      expect(result).toMatch(/^0x[A-Fa-f0-9]+$/);
      expect(ethers.Transaction.from(result)).toMatchObject({
        value: 1000000000000000000n,
        to: "0x0000000000000000000000000000000000001005",
      });
      expectTransactionForMode(ethers.Transaction.from(result));
    });
  });

  describe.each([
    [
      "legacy",
      (estimation: FeeEstimation): void => {
        expect(estimation).toEqual({
          value: expect.any(BigInt),
          parameters: {
            gasPrice: expect.any(BigInt),
            gasLimit: expect.any(BigInt),
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
            type: 0,
          },
        });
        expect(estimation.value).toBeGreaterThan(0);
        expect(estimation.parameters?.gasPrice).toBeGreaterThan(0);
      },
    ],
    [
      "eip1559",
      (estimation: FeeEstimation): void => {
        expect(estimation).toEqual({
          value: expect.any(BigInt),
          parameters: {
            gasPrice: null,
            gasLimit: expect.any(BigInt),
            maxFeePerGas: expect.any(BigInt),
            maxPriorityFeePerGas: expect.any(BigInt),
            nextBaseFee: expect.any(BigInt),
            type: 2,
          },
        });
        expect(estimation.value).toBeGreaterThan(0);
        expect(estimation.parameters?.maxFeePerGas).toBeGreaterThan(0);
        expect(estimation.parameters?.maxPriorityFeePerGas).toBeGreaterThan(0);
        expect(estimation.parameters?.nextBaseFee).toBeGreaterThan(0);
      },
    ],
  ])("estimateFees for %s transaction", (mode, expectEstimationForMode) => {
    it("estimates fees for staking delegation", async () => {
      const result = await module.estimateFees({
        type: `staking-${mode}`,
        intentType: "staking" as const,
        amount: 1000000000000000000n, // 1 SEI
        mode: "delegate",
        sender: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        recipient: "0x0000000000000000000000000000000000001005",
        valAddress: "seivaloper1ummny4p645xraxc4m7nphf7vxawfzt3p5hn47t",
        data: { type: "buffer", value: Buffer.from([]) },
        asset: {
          type: "native",
        },
      } as StakingTransactionIntent<MemoNotSupported, BufferTxData>);

      expectEstimationForMode(result);
    });
  });
});

describe("EVM Api (Zero Gravity)", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://evmrpc.0g.ai",
      },
      explorer: {
        type: "etherscan",
        uri: "https://chainscan.0g.ai/open/api",
        maxLimit: 99, // use 99 so internal `limit + 1` probing stays within the explorer's hard max of 100
      },
    };
    module = createApi(config as EvmConfig, "zero_gravity");
  });

  describe("listOperations", () => {
    it("returns consistent results for limits below/at/above 100", async () => {
      const address = "0x70793181A947C4034B0F9E547e5a8D1a21B9bD60";
      const commonParams = {
        minHeight: 0,
        order: "desc" as const,
      };

      const [limit99, limit100, limit101] = await Promise.all([
        module.listOperations(address, { ...commonParams, limit: 99 }),
        module.listOperations(address, { ...commonParams, limit: 100 }),
        module.listOperations(address, { ...commonParams, limit: 101 }),
      ]);

      const allResults = [limit99, limit100, limit101];

      allResults.forEach(result => {
        expect(result).toEqual(
          expect.objectContaining({
            items: expect.any(Array),
            next: expect.any(String),
          }),
        );

        // Ensure basic operation structure remains valid across limits.
        result.items.forEach(op => {
          expect(op.tx.date).toBeInstanceOf(Date);
        });
      });

      // Larger limits should not return fewer operations.
      expect(limit99.items.length).toBeLessThanOrEqual(limit100.items.length);
      expect(limit100.items.length).toBeLessThanOrEqual(limit101.items.length);

      // Results should be consistent when increasing limits.
      const atCapIds = new Set(limit100.items.map(op => op.id));
      expect(limit99.items.every(op => atCapIds.has(op.id))).toBe(true);

      const aboveCapIds = new Set(limit101.items.map(op => op.id));
      expect(limit100.items.every(op => aboveCapIds.has(op.id))).toBe(true);
    }, 60000);

    it("returns operations with valid dates", async () => {
      // Regression test: chainscan.0g.ai returns "timestamp" (lowercase) instead of the
      // standard etherscan "timeStamp" (camelCase), causing op.tx.date to be an Invalid Date.
      const address = "0xa86a063a764f96cdb64dac0e5e780d5ade6bdbd5";
      const result = await module.listOperations(address, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });

      const cutoff = new Date("2015-01-01T00:00:00Z").getTime();

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach(op => {
        expect(op.tx.date).toBeInstanceOf(Date);
        const txTime = op.tx.date.getTime();
        expect(txTime).not.toBeNaN();
        expect(txTime).toBeGreaterThan(cutoff);

        expect(op.tx.block.time).toBeInstanceOf(Date);
        const blockTime = op.tx.block.time!.getTime();
        expect(blockTime).not.toBeNaN();
        expect(blockTime).toBeGreaterThan(cutoff);
      });
    }, 60000);
  });
});
