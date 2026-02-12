import {
  Api,
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  Operation,
  StakingTransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
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
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
    module = createApi(config as EvmConfig, "ethereum");
  });

  describe("getSequence", () => {
    it("returns 0 as next sequence for a pristine account", async () => {
      expect(await module.getSequence("0x6895Df5ed013c85B3D9D2446c227C9AfC3813551")).toEqual(0n);
    });

    it("returns next sequence for an address", async () => {
      expect(
        await module.getSequence("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1"),
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
      ).toEqual([[], ""]);
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
        const [result] = await module.listOperations("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1", {
          minHeight: 200,
          order,
        });
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
          expect(op.tx.block.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
          expect(op.tx.block.height).toBeGreaterThanOrEqual(200);
          expect(op.tx.fees).toBeGreaterThan(0);
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

        const [p1Ops, p1Token] = await module.listOperations(address, {
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

        const [p2Ops, p2Token] = await module.listOperations(address, {
          minHeight: 200,
          order,
          limit,
          pagingToken: p1Token,
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
        expect(p1Heights.intersection(p2Heights).size).toBe(0);

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
        const [firstCallResult, firstCallToken] = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 5,
        });

        // Same call again - should return same result (cached or not)
        const [cachedResult] = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 5,
        });

        // Different limit - should return different results
        const [greaterLimitResult] = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 10,
        });

        // Different order - should return different results
        const [differentOrderResult] = await module.listOperations(address, {
          minHeight: 200,
          order: "asc",
          limit: 5,
        });

        // Different pagingToken - should return different results
        const [differentTokenResult] = await module.listOperations(address, {
          minHeight: 200,
          order: "desc",
          limit: 5,
          pagingToken: firstCallToken,
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

describe("EVM Api (SEI Network)", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

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
