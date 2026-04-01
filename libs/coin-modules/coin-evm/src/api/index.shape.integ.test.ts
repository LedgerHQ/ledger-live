import { AlpacaApi, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { fail } from "assert";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("Shape (external node)", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("getBlock", () => {

    let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

    beforeAll(() => {
      const shapeConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://mainnet.shape.network",
        },
        explorer: {
          type: "blockscout",
          uri: "https://shapescan.xyz/api",
        },
        showNfts: true,
      };
      module = createApi(shapeConfig, "shape");
    });

    it("should return WETH mint from Deposit log in block 26327282 (tx 0x08761e…) see BACK-10995", async () => {
      const weth = "0x4200000000000000000000000000000000000006";
      const expectedAmount = 200000000000000n;
      const txHash =
        "0x08761ed077ea43c8bd56cf7c7e5ab2180e1cb06533afa34b2ac3778f9f5d13a8";

      const block = await module.getBlock(26327282);
      const tx = block.transactions.find(t => t.hash === txHash);
      if (!tx) {
        fail(`Transaction ${txHash} not found in block ${26327282}`);
      }
      expect(tx.operations).toContainEqual(expect.objectContaining({
        type: "transfer",
        asset: {
          type: "erc20",
          assetReference: weth,
        },
        amount: expectedAmount,
      }));
    });
  });
});
