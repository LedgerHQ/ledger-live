import { Api, FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { ethers, BigNumber } from "ethers";
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
    },
  ],
])("EVM Api (%s)", (_, config) => {
  let module: Api;

  beforeAll(() => {
    module = createApi(config as EvmConfig, "ethereum");
  });

  describe("getSequence", () => {
    it("returns 0 as next sequence for a pristine account", async () => {
      expect(await module.getSequence("0x6895Df5ed013c85B3D9D2446c227C9AfC3813551")).toEqual(0);
    });

    it("returns next sequence for an address", async () => {
      expect(
        await module.getSequence("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1"),
      ).toBeGreaterThanOrEqual(17);
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
        expect(transaction).toMatchObject({
          type: null,
          gasPrice: expect.any(ethers.BigNumber),
        });
        expect(transaction.gasPrice?.toBigInt()).toBeGreaterThan(0);
      },
    ],
    [
      "eip1559",
      (transaction: ethers.Transaction): void => {
        expect(transaction).toMatchObject({
          type: 2,
          gasPrice: null,
          maxFeePerGas: expect.any(ethers.BigNumber),
          maxPriorityFeePerGas: expect.any(ethers.BigNumber),
        });
        expect(transaction.maxFeePerGas?.toBigInt()).toBeGreaterThan(0);
        expect(transaction.maxPriorityFeePerGas?.toBigInt()).toBeGreaterThan(0);
      },
    ],
  ])("craftTransaction", (mode, expectTransactionForMode) => {
    it("crafts a transaction with the native asset", async () => {
      const result = await module.craftTransaction({
        type: `send-${mode}`,
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "native",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]+$/);
      expect(ethers.utils.parseTransaction(result)).toMatchObject({
        value: BigNumber.from(10),
        to: "0x7b2C7232f9E38F30E2868f0E5Bf311Cd83554b5A",
      });
      expectTransactionForMode(ethers.utils.parseTransaction(result));
    });

    it("crafts a transaction with the USDC asset", async () => {
      const result = await module.craftTransaction({
        type: `send-${mode}`,
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "erc20",
          assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]+$/);
      expect(ethers.utils.parseTransaction(result)).toMatchObject({
        value: BigNumber.from(0),
        to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      });
      expectTransactionForMode(ethers.utils.parseTransaction(result));
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

    it("list operations for an address", async () => {
      const [result] = await module.listOperations("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1", {
        minHeight: 200,
        order: "asc",
      });
      expect(result.length).toBeGreaterThanOrEqual(52);
      result.forEach(op => {
        expect(["FEES", "IN", "OUT"]).toContainEqual(op.type);
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
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            nextBaseFee: null,
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
            maxFeePerGas: expect.any(BigInt),
            maxPriorityFeePerGas: expect.any(BigInt),
            nextBaseFee: expect.any(BigInt),
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
        amount: 100000000000000n, // 0.0001 ETH (smaller amount)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "native",
        },
      });

      expectEstimationForMode(result);
    });

    it("estimates fees for USDC token transfer", async () => {
      const result = await module.estimateFees({
        type: `send-${mode}`,
        amount: 1000000n, // 1 USDC (6 decimals)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "erc20",
          assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expectEstimationForMode(result);
    });
  });
});
