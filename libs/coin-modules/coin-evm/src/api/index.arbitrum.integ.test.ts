import {
  AlpacaApi,
  BufferTxData,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Arbitrum Network", () => {
  let module: AlpacaApi<MemoNotSupported, BufferTxData> & BridgeApi;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://arbitrum.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan-ci.api.live.ledger.com/v2/api/42161",
      },
    };
    module = createApi(config as EvmConfig, "arbitrum");
  });

  describe("listOperations", () => {
    /**
     * All operations for a given transaction must report the same `tx.fees` (the chain’s gas paid once per tx).
     * Regression for explorer/token-enrichment paths that duplicated or inflated fees on child ops.
     *
     * @see https://ledgerhq.atlassian.net/browse/BACK-10954
     */
    it("reports identical tx.fees for every operation of the same transaction hash", async () => {
      const address = "0x63f5c1b5a54a2423a0284b55ad6e48485e048e6a";
      const txHash =
        "0xdd046a625b9b4b1ec9c9eaabfa61869f74d9d744433dae3c7686432301713bb3".toLowerCase();

      const { items: operations } = await module.listOperations(address, {
        minHeight: 99668800,
        order: "asc",
      });

      const opsForTx = operations.filter(op => op.tx.hash.toLowerCase() === txHash);

      expect(opsForTx.length).toBeGreaterThanOrEqual(2);

      const uniqueFees = [...new Set(opsForTx.map(op => op.tx.fees))];
      expect(uniqueFees).toEqual([opsForTx[0]!.tx.fees]);
    });

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
