import {
  AlpacaApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Arbitrum Network", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://arbitrum.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42161",
      },
    };
    module = createApi(config as EvmConfig, "arbitrum");
  });

  describe("listOperations", () => {
    it("returns operations with valid tx hash for address with internal transactions", async () => {
      const { items: operations } = await module.listOperations(
        "0x63f5c1b5a54a2423a0284b55ad6e48485e048e6a",
        {
          minHeight: 0,
          order: "asc",
        },
      );

      const internalOperations = operations.filter(op => op.details?.internal === true);

      expect(internalOperations.length).toBeGreaterThan(0);
      internalOperations.forEach(op => {
        expect(op.tx.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
      });
    });
  });
});
