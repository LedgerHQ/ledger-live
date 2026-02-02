import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

const SONGBIRD_ADDRESS = "0x347D971A24a2570eB8E0b3CbbdCE1Ecbb31f67DC";

describe("EVM Songbird Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config: EvmConfig = {
      node: {
        type: "external",
        uri: "https://songbird-api.flare.network/ext/C/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://songbird-explorer.flare.network/api",
      },
      showNfts: false,
    };
    module = createApi(config, "songbird");
  });

  describe("listOperations", () => {
    it("returns operations for address with limit of 50", async () => {
      const start = Date.now();
      const [operations, pagingToken] = await module.listOperations(SONGBIRD_ADDRESS, {
        minHeight: 0,
        order: "asc",
        limit: 50,
      });
      const elapsed = Date.now() - start;
      console.log(`listOperations took ${elapsed/1000}s (${operations.length} operations, token: ${pagingToken})`);
      console.log(`operations ids: \n${operations.map(op => op.id).join("\n")}`);
    });
  });
});
