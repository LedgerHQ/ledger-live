import type {
  AlpacaApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Api (Monad Testnet)", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    module = createApi(
      {
        node: { type: "external", uri: "https://testnet-rpc.monad.xyz" },
        explorer: {
          type: "etherscan",
          uri: "https://proxyetherscan.api.live.ledger.com/v2/api/10143",
        },
        showNfts: false,
      } as EvmConfig,
      "monad_testnet",
    );
  });

  describe("listOperations", () => {
    /**
     * Non-regression: the Monad Testnet explorer returns `{"result": null}` for the
     * `txlistinternal` endpoint when an address has no internal transactions, instead
     * of the standard `{"result": []}`. This used to crash with
     * "Cannot read properties of null (reading 'map')".
     * @see https://alpaca.api.ledger.com/v1/monad_testnet/account/0x152b9c98dfdfb79c3708f0179bc63fdcef455465/operations?minHeight=0&order=asc&limit=50
     */
    it("returns operations without crashing when explorer returns null for internal transactions", async () => {
      const { items } = await module.listOperations("0x152b9c98dfdfb79c3708f0179bc63fdcef455465", {
        minHeight: 0,
        order: "asc",
        limit: 50,
      });

      expect(items).toBeInstanceOf(Array);
      items.forEach(op => {
        expect(op.tx.hash).toMatch(/^0x[A-Fa-f0-9]{64}$/);
        expect(op.tx.date).toBeInstanceOf(Date);
        expect(typeof op.value).toBe("bigint");
      });
    });
  });
});
