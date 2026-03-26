import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { UnsupportedRpcMethodError } from "../errors";
import { createApi } from "./index";

/**
 * Flare: blockscout internal-tx calls often error (e.g. HTTP 500); the node has no `trace_block`, so we rely on
 * `debug_traceBlockByNumber` + `callTracer`. For historic height `0x36e9783` the public RPC returns
 * "historical state unavailable", so internal txs cannot be merged.
 *
 * `getBlock` must reject in that situation (see fix(coin-evm): fail when internal txs can't be retrieved — 4527739925).
 *
 * `curl -sS -X POST -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x36e9783",false],"id":1}' 'https://rpc.au.cc/flare'`
 */
describe("Flare (external node + blockscout)", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("getBlock", () => {
    let module: ReturnType<typeof createApi>;

    beforeAll(() => {
      const flareConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://rpc.au.cc/flare",
        },
        explorer: {
          type: "blockscout",
          uri: "https://flare-explorer.flare.network/api",
        },
        showNfts: false,
      };
      module = createApi(flareConfig, "flare");
    });

    it("rejects getBlock for 0x36e9783 when internal txs cannot be retrieved from explorer nor debug trace", async () => {
      const err = await module.getBlock(0x36e9783).then(
        () => {
          throw new Error("expected getBlock to reject");
        },
        (e: unknown) => e,
      );
      expect(
        err instanceof UnsupportedRpcMethodError && err.method === "debug_traceBlockByNumber",
      ).toBe(true);
    });
  });
});
