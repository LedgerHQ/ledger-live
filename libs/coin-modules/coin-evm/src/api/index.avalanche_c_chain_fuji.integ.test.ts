import {
  AlpacaApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Avalanche C-Chain Fuji", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://api.avax-test.network/ext/bc/C/rpc",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/43113",
      },
    };
    module = createApi(config as EvmConfig, "avalanche_c_chain_fuji");
  });

  describe("listOperations", () => {
    /**
     * Contract-creation tx: explorer `to` is empty; adapter should surface `contractAddress` as recipient.
     */
    it("returns the deployed contract as recipient for a contract-creation tx", async () => {
      const address = "0xf1eda3b7e0b22be4b575079e15f69be069bdeb2e";
      const txHash =
        "0x9a9a5d7698b267c7d42e0484da1f03b255d729d8fcd3fd27285a186782393f62".toLowerCase();
      const minHeight = 4_812_848;

      const { items: operations } = await module.listOperations(address, {
        minHeight,
        order: "asc",
      });

      const feesOp = operations.find(
        op => op.tx.hash.toLowerCase() === txHash && op.id.endsWith("-FEES"),
      );

      expect({
        found: feesOp !== undefined,
        type: feesOp?.type,
        value: feesOp?.value.toString(),
        recipients: feesOp?.recipients,
        senders: feesOp?.senders.map(a => a.toLowerCase()),
        txFees: feesOp?.tx.fees.toString(),
        txFailed: feesOp?.tx.failed,
      }).toEqual({
        found: true,
        type: "OUT",
        value: "0",
        recipients: ["0xc923061fFE6D7135a1907Ca74E77cB5c4c85Ab2b"],
        senders: ["0xf1eda3b7e0b22be4b575079e15f69be069bdeb2e"],
        txFees: "71794075000000000",
        txFailed: false,
      });
    });
  });
});
