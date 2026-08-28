import { EvmConfig } from "../config";
import { createMockEvmContext } from "../fixtures/context.fixtures";
import { createApi } from "./index";

describe("Flare (external node)", () => {
  describe("getBlock", () => {
    let module: ReturnType<typeof createApi>;

    const flareConfig: EvmConfig = {
      chainId: 14,
      name: "Flare",
      node: {
        type: "external",
        uri: "https://rpc.au.cc/flare",
      },
      explorer: {
        type: "blockscout",
        uri: "https://I.AM.FAILING", // so that internal txs cannot be retrieved from explorer
      },
    };
    beforeAll(() => {
      module = createApi("flare");
    });

    it("internal txs can be retrieved from node", async () => {
      // the support for trace on https://rpc.au.cc/flare (Geth as of 2026-03-27) is very ephemeral,
      // - test on the tip of the chain without guarantees there is actually internal txs
      // - test that the call is not failing (getBlock should not reject)
      const info = await module.lastBlock(createMockEvmContext(flareConfig));
      const block = await module
        .getBlock(createMockEvmContext(flareConfig), info.height)
        .catch((e: unknown) => {
          if (
            e &&
            typeof e === "object" &&
            "rawError" in e &&
            (e as { rawError?: unknown }).rawError
          ) {
            throw (e as { rawError: unknown }).rawError;
          }
          throw e;
        });
      expect(block.info.height).toBe(info.height);
    });
  });
});
