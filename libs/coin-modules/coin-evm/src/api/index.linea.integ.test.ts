import {
  AlpacaApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

/**
 * Integration tests for getBlock with internal transactions (etherscan/blockscout).
 *
 * Linea block 19500620, tx 0x85a126db75d00c52b7ee410b6ddedef9108c9727f5e588d747d76ca9da22c55f
 * contains an internal native transfer of 240000481795678944 from
 * 0x224D8Fd7aB6AD4c6eb4611Ce56EF35Dec2277F03 to 0x9F41fE989C556d8b312Ce398b7f7B5Ac90919a73.
 *
 * Linea block 5234650, tx 0x86130492fc3195c7163f5b1a3b42d79c737d20834365bff434cd6ab94832d610
 * is a plain native transfer of 2 ETH (single negative transfer op from sender, no duplicate internals).
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

    let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

    beforeAll(() => {
      const lineaConfig: EvmConfig = {
        node: {
          type: "external",
          uri: "https://rpc.linea.build",
        },
        explorer: {
          type: "etherscan",
          uri: "https://proxyetherscan-ci.api.live.ledger.com/v2/api/59144",
        },
        showNfts: false,
      };
      module = createApi(lineaConfig, "linea");
    });

    it("should include internal native transfer in block transaction", async () => {
      const block = await module.getBlock(BLOCK_HEIGHT);

      expect(block.info.height).toBe(BLOCK_HEIGHT);

      const tx = block.transactions.find(t => t.hash === TX_HASH);
      expect(tx?.hash).toBe(TX_HASH);
      expect(tx?.operations).toContainEqual({
        type: "transfer",
        address: FROM,
        peer: TO,
        asset: { type: "native" },
        amount: -EXPECTED_AMOUNT,
      });
      expect(tx?.operations).toContainEqual({
        type: "transfer",
        address: TO,
        peer: FROM,
        asset: { type: "native" },
        amount: EXPECTED_AMOUNT,
      });
    });

    it("block 5234650: exactly one sender native transfer (2 ETH) on simple value tx", async () => {
      const blockHeight = 5234650;
      const txHash = "0x86130492fc3195c7163f5b1a3b42d79c737d20834365bff434cd6ab94832d610";
      const sender = "0x9F41fE989C556d8b312Ce398b7f7B5Ac90919a73";
      const recipient = "0x5d50bE703836C330Fc2d147a631CDd7bb8D7171c";
      const block = await module.getBlock(blockHeight);
      const tx = block.transactions.find(t => t.hash === txHash);
      if (!tx) {
        fail(`Transaction ${txHash} not found in block ${blockHeight}`);
      }
      const expectedOp = {
        type: "transfer",
        address: sender,
        peer: recipient,
        asset: { type: "native" },
        amount: -2000000000000000000n,
      };
      const senderOutNative = tx.operations.filter(
        op =>
          op.type === "transfer" &&
          op.asset.type === "native" &&
          op.amount === expectedOp.amount &&
          op.address === expectedOp.address &&
          op.peer === expectedOp.peer,
      );
      expect(senderOutNative).toEqual([expectedOp]);
    });
  });
});
