import { AlpacaApi } from "@ledgerhq/coin-framework/lib/api/types";
import { EvmConfig } from "../config";
import { EvmAsset } from "../types";
import { createApi } from "./index";

describe.each([
  ["external node", { type: "external", uri: "https://ethereum-rpc.publicnode.com" }],
  ["ledger node", { type: "ledger", explorerId: "eth" }],
])("EVM Api (%s)", (_, node) => {
  let module: AlpacaApi<EvmAsset>;

  beforeAll(() => {
    module = createApi({ node } as EvmConfig, "ethereum");
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
});
