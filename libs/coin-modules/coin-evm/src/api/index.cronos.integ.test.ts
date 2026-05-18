import {
  CoinModuleApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Cronos Network (blockscout explorer)", () => {
  let module: CoinModuleApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://cronos.coin.ledger.com",
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
        ...(page1.next ? { cursor: page1.next } : {}),
      });

      expect(page2.items.length).toBeGreaterThan(0);
      expect(page2.next?.length).toBeGreaterThan(0);
      expect(page2.next).not.toEqual(page1.next);
    });
  });

  describe("getBlock", () => {
    it("should return block 61398731 without failing on unsigned typed transactions", async () => {
      const block = await module.getBlock(61398731);
      const transaction = block.transactions.find(
        tx => tx.hash === "0x49a46bf29edb4faf38d062ea8d799915209f45dc96c0ff1f4c919d260c76642c",
      );

      expect(block.info.height).toBe(61398731);
      expect(block.info.hash).toBe(
        "0x95332a689b2409de3f8c88e87d0ad4c9317fb84cd864ca0adb771abddf717f89",
      );
      expect(block.transactions.length).toBeGreaterThan(0);
      expect(transaction?.fees).toBe(7959000000000000n);
    });
  });
});
