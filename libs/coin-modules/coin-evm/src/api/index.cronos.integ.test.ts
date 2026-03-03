import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Cronos Network (blockscout explorer)", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://evm.cronos.org",
      },
      explorer: {
        type: "blockscout",
        uri: "https://cronos.org/explorer/api",
      },
    };
    module = createApi(config as EvmConfig, "cronos");
  });

  describe("listOperations", () => {
    it("paginates with distinct cursors across pages", async () => {
      const page1 = await module.listOperations("0x24b8bfd98f38322435699595358b4f997ceefd16", {
        minHeight: 0,
        order: "asc",
        limit: 100,
      });

      expect(page1.items.length).toBeGreaterThan(0);
      expect(page1.next?.length).toBeGreaterThan(0);

      const page2 = await module.listOperations("0x24b8bfd98f38322435699595358b4f997ceefd16", {
        minHeight: 0,
        order: "asc",
        limit: 100,
        cursor: page1.next,
      });

      expect(page2.items.length).toBeGreaterThan(0);
      expect(page2.next?.length).toBeGreaterThan(0);
      expect(page2.next).not.toEqual(page1.next);
    });
  });
});
