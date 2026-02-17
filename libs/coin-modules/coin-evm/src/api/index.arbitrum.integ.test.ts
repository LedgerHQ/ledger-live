import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

describe("EVM Arbitrum Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config = {
      node: {
        type: "external",
        uri: "https://arb1.arbitrum.io/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://arbitrum.blockscout.com/api",
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
