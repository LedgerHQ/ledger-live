import {
  Api,
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  Operation,
  StakingTransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { ethers } from "ethers";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { EvmConfig } from "../config";
import { setCryptoAssetsStoreGetter } from "../cryptoAssetsStore";
import { createApi } from "./index";

initializeLegacyTokens(addTokens);

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
    setCryptoAssetsStoreGetter(() => getCryptoAssetsStore());
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

    it("returns balance for an address", async () => {
      const result = await module.getBalance("0x9bcd841436ef4f85dacefb1aec772af71619024e");

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
    setCryptoAssetsStoreGetter(() => legacyCryptoAssetsStore);
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
    module = createApi(config as EvmConfig, "sei_network_evm");
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
