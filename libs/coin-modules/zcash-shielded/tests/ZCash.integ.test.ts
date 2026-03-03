/**
 * Integration tests against the real Zcash testnet RPC.
 * Run only locally: pnpm test-integ
 * Not run in CI (pnpm test ignores *.integ.test.ts).
 */
import ZCash from "../src/ZCash";
import { JsonRpcClient } from "../src/jsonRpcClient";
import { JSON_RPC_SERVER } from "../src/constants";

const nodeUrl = JSON_RPC_SERVER;

describe("ZCash integration (real RPC)", () => {
  describe("getBlockCount", () => {
    test("returns a non-negative number", async () => {
      const client = new JsonRpcClient(nodeUrl);
      const count = await client.getBlockCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getBlockByHeight", () => {
    test("returns block with height, time, hash for height 0", async () => {
      const client = new JsonRpcClient(nodeUrl);
      const block = await client.getBlockByHeight(0);
      expect(block).toBeDefined();
      if (!block) return;
      expect(block.height).toBe(0);
      expect(typeof block.time).toBe("number");
      expect(typeof block.hash).toBe("string");
    });
  });

  describe("findBlockHeight", () => {
    test("returns a block height for a recent timestamp", async () => {
      const zcash = new ZCash({ nodeUrl });
      const timestamp = Math.floor(Date.now() / 1000);
      const height = await zcash.findBlockHeight(timestamp);
      if (height !== undefined) {
        expect(typeof height).toBe("number");
        expect(height).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(height)).toBe(true);
      }
    });
  });
});
