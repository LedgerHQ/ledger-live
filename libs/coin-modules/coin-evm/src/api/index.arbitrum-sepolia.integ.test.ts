import { Api, BufferTxData, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { EvmConfig } from "../config";
import { createApi } from "./index";

const ARBITRUM_SEPOLIA_ADDRESS = "0x83e89621c66f2A2D88b3DA66c281E00877cD64c1";

describe("EVM Arbitrum Sepolia Network", () => {
  let module: Api<MemoNotSupported, BufferTxData>;

  beforeAll(() => {
    setupCalClientStore();
    const config: EvmConfig = {
      node: {
        type: "external",
        uri: "https://sepolia-rollup.arbitrum.io/rpc",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/421614",
      },
      showNfts: false,
    };
    module = createApi(config, "arbitrum_sepolia");
  });

  describe("listOperations", () => {
    it("returns operations for address with limit of 50", async () => {
      const start = Date.now();
      const [operations, pagingToken] = await module.listOperations(ARBITRUM_SEPOLIA_ADDRESS, {
        minHeight: 0,
        order: "desc",
        limit: 10,
      });
      const elapsed = Date.now() - start;
      console.log(
        `listOperations took ${elapsed / 1000}s (${operations.length} operations, token: ${pagingToken})`,
      );
    });
    it.only("returns as many operations in desc mode as in asc mode", async () => {
      const address = "0xeE7Db87F7D7A558d7FD89D9c8f5c19501CEFACfE";
      const [operationsDesc, pagingTokenDesc] = await module.listOperations(address, {
        minHeight: 0,
        order: "desc",
        limit: 200,
      });
      const [operationsAsc, pagingTokenAsc] = await module.listOperations(address, {
        minHeight: 0,
        order: "asc",
        limit: 200,
      });

      console.log(`nb operations in desc mode: ${operationsDesc.length}`);
      console.log(`nb operations in asc mode: ${operationsAsc.length}`);
      console.log(`paging token in desc mode: ${pagingTokenDesc}`);
      console.log(`paging token in asc mode: ${pagingTokenAsc}`);
      expect(operationsDesc.length).toBe(operationsAsc.length);
      expect(pagingTokenDesc).toBe(pagingTokenAsc);

    });
  });
});
