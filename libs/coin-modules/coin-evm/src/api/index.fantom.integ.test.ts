import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { safeEncodeEIP55 } from "../utils";
import { createApi } from "./index";

describe("Fantom (etherscan explorer)", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("getBlock", () => {
    let module: Api<MemoNotSupported, BufferTxData>;

    beforeAll(() => {
      const fantomConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://rpcapi.fantom.network",
        },
        explorer: {
          type: "blockscout",
          uri: "https://ftmscout.com/api",
        },
        showNfts: false,
      };
      module = createApi(fantomConfig, "fantom");
    });

    it("should include internal native transfer in block transaction", async () => {
      // for fantom, blockscout explorer returns no internal transactions for block 120647648, even though there are 3 !!
      // ❯ curl -s "https://ftmscout.com/api?module=account&action=txlistinternal&startblock=120647648&endblock=120647648"
      // {"message":"No internal transactions found","result":[],"status":"0"}

      // ❯ curl -s -X POST "https://rpcapi.fantom.network" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"trace_block","params":["0x730efe0"]}' | jq '.result | length'
      // 6

      //
      const blockHeight = 120647648;
      const expectedAmount = 0x15a7c087e1eb7e18n;

      /*
       * Fantom block 120647648 contains (among others) 3 internal native transfers with value 0x15a7c087e1eb7e18:
       * - 0x59e8070de88cc1e4085293efd08aad4fba2ef6e0 → 0x44ceb2cdd0e9891f26ce5b96d2a7a3017304c25f
       * - 0x44ceb2cdd0e9891f26ce5b96d2a7a3017304c25f → 0x68e369edc0d374f86295690cbaa981ee3709c061
       * - 0x68e369edc0d374f86295690cbaa981ee3709c061 → 0x10bb279126abd92d886aa3f2a60955c28bf14926
       */
      const addr1 = safeEncodeEIP55("0x59e8070de88cc1e4085293efd08aad4fba2ef6e0");
      const addr2 = safeEncodeEIP55("0x44ceb2cdd0e9891f26ce5b96d2a7a3017304c25f");
      const addr3 = safeEncodeEIP55("0x68e369edc0d374f86295690cbaa981ee3709c061");
      const addr4 = safeEncodeEIP55("0x10bb279126abd92d886aa3f2a60955c28bf14926");

      const block = await module.getBlock(blockHeight);

      expect(block.info.height).toBe(blockHeight);

      const tx = block.transactions.find(
        t => t.hash === "0x18815c2073a78c2264b89ee4b4a9267eb31c4c0a91b9d4d751ddd84b26584493",
      );
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr1,
        peer: addr2,
        asset: { type: "native" },
        amount: -expectedAmount,
      });
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr2,
        peer: addr1,
        asset: { type: "native" },
        amount: expectedAmount,
      });
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr2,
        peer: addr3,
        asset: { type: "native" },
        amount: -expectedAmount,
      });
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr3,
        peer: addr2,
        asset: { type: "native" },
        amount: expectedAmount,
      });
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr3,
        peer: addr4,
        asset: { type: "native" },
        amount: -expectedAmount,
      });
      expect(tx!.operations).toContainEqual({
        type: "transfer",
        address: addr4,
        peer: addr3,
        asset: { type: "native" },
        amount: expectedAmount,
      });
    });
  });
});
