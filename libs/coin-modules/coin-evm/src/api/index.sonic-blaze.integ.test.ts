import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

const SONIC_BLAZE_ADDRESS = "0x58b26467239a23c8b8d92b85d16256b669c758d5";

describe("EVM Sonic Blaze Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config: EvmConfig = {
      node: {
        type: "external",
        uri: "https://rpc.blaze.soniclabs.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/57054",
      },
      showNfts: false,
    };
    module = createApi(config, "sonic_blaze");
  });

  describe("listOperations", () => {
    it("returns operations for address with limit of 50", async () => {
      const start = Date.now();
      const [operations, pagingToken] = await module.listOperations(SONIC_BLAZE_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 50,
      });
      const elapsed = Date.now() - start;
      console.log(
        `listOperations took ${elapsed / 1000}s (${operations.length} operations, token: ${pagingToken})`,
      );
    });
  });
});
