import { AlpacaApi, FeeEstimation } from "@ledgerhq/coin-framework/lib/api/types";
import { EvmConfig } from "../config";
import { EvmAsset } from "../types";
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
  let module: AlpacaApi<EvmAsset>;

  beforeAll(() => {
    module = createApi(config as EvmConfig, "ethereum");
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await module.lastBlock();

      expect(result.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("craftTransaction", () => {
    it("crafts a transaction with the native asset", async () => {
      const result = await module.craftTransaction({
        type: "send",
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "native",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]{64}$/);
    });

    it("crafts a transaction with the USDC asset", async () => {
      const result = await module.craftTransaction({
        type: "send",
        amount: 10n,
        sender: "0x9bcd841436ef4f85dacefb1aec772af71619024e",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "token",
          standard: "erc",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expect(result).toMatch(/^0x[A-Fa-f0-9]{204}$/);
    });
  });

  describe("getBalance", () => {
    it("returns balance for an address", async () => {
      const result = await module.getBalance("0x9bcd841436ef4f85dacefb1aec772af71619024e");

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        value: expect.any(BigInt),
        asset: { type: "native" },
      });
    });
  });

  describe("listOperations", () => {
    it("list operations for an address", async () => {
      const [result] = await module.listOperations("0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1", {
        minHeight: 200,
      });
      expect(result.length).toBeGreaterThanOrEqual(52);
      result.forEach(op => {
        expect(["FEES", "IN", "OUT"]).toContainEqual(op.type);
        expect(op.senders.concat(op.recipients)).toContain(
          "0xB69B37A4Fb4A18b3258f974ff6e9f529AD2647b1",
        );
        expect(op.value).toBeGreaterThanOrEqual(0n);
        expect(op.tx.block.height).toBeGreaterThanOrEqual(200);
      });
    });
  });

  describe("estimateFees", () => {
    it("estimates fees for native asset transfer", async () => {
      const result: FeeEstimation = await module.estimateFees({
        type: "send",
        amount: 100000000000000n, // 0.0001 ETH (smaller amount)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "native",
        },
      });

      expect(typeof result.value).toBe("bigint");
      expect(result.value).toBeGreaterThan(0n);
    });

    it("estimates fees for USDC token transfer", async () => {
      const result = await module.estimateFees({
        type: "send",
        amount: 1000000n, // 1 USDC (6 decimals)
        sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        asset: {
          type: "token",
          standard: "erc",
          contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        },
      });

      expect(typeof result.value).toBe("bigint");
      expect(result.value).toBeGreaterThan(0n);
    });
  });
});
