import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

/**
 * Integration tests for getBlock with internal transactions (etherscan/blockscout).
 *
 * Linea block 19500620, tx 0x85a126db75d00c52b7ee410b6ddedef9108c9727f5e588d747d76ca9da22c55f
 * contains an internal native transfer of 240000481795678944 from
 * 0x224D8Fd7aB6AD4c6eb4611Ce56EF35Dec2277F03 to 0x9F41fE989C556d8b312Ce398b7f7B5Ac90919a73.
 */

describe("Linea (etherscan explorer)", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("getBlock", () => {
    const BLOCK_HEIGHT = 19500620;
    const TX_HASH = "0x85a126db75d00c52b7ee410b6ddedef9108c9727f5e588d747d76ca9da22c55f";
    const EXPECTED_AMOUNT = 240000481795678944n;
    const FROM = "0x224D8Fd7aB6AD4c6eb4611Ce56EF35Dec2277F03";
    const TO = "0x9F41fE989C556d8b312Ce398b7f7B5Ac90919a73";

    let module: Api<MemoNotSupported, BufferTxData>;

    beforeAll(() => {
      const lineaConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://rpc.linea.build",
        },
        explorer: {
          type: "etherscan",
          uri: "https://proxyetherscan.api.live.ledger.com/v2/api/59144",
        },
        showNfts: false,
      };
      module = createApi(lineaConfig, "linea");
    });

    it("should include internal native transfer in block transaction", async () => {
      const block = await module.getBlock(BLOCK_HEIGHT);

      expect(block.info.height).toBe(BLOCK_HEIGHT);

      const tx = block.transactions.find(t => t.hash === TX_HASH);
      expect(tx.hash).toBe(TX_HASH);
      expect(tx.operations).toContainEqual({
        type: "transfer",
        address: FROM,
        peer: TO,
        asset: { type: "native" },
        amount: -EXPECTED_AMOUNT,
      });
      expect(tx.operations).toContainEqual({
        type: "transfer",
        address: TO,
        peer: FROM,
        asset: { type: "native" },
        amount: EXPECTED_AMOUNT,
      });
    });
  });
});
