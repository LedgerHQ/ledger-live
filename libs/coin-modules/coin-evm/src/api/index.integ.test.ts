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
});
