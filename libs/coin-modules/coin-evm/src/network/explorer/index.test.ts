import { AssertionError, fail } from "assert";
import { EvmConfigInfo } from "../../config";
import { UnknownExplorer } from "../../errors";
import etherscanLikeApi from "./etherscan";
import ledgerExplorerApi from "./ledger";
import { getExplorerApi } from "./index";

const configFor = (currencyId: string): EvmConfigInfo => {
  switch (currencyId) {
    case "anything-coin":
      return { explorer: { type: "anything", uri: "notworking" } } as any;
    case "etherscan-coin":
      return { explorer: { type: "etherscan", uri: "working" } } as any;
    case "blockscout-coin":
      return { explorer: { type: "blockscout", uri: "working" } } as any;
    case "etherscan-coin-no-cache":
      return { explorer: { type: "etherscan", uri: "working", noCache: true } } as any;
    case "blockscout-coin-no-cache":
      return { explorer: { type: "blockscout", uri: "working", noCache: true } } as any;
    case "ledger-coin":
      return { explorer: { type: "ledger", explorerId: "eth" } } as any;
    default:
      return {} as any;
  }
};

describe("EVM Family", () => {
  describe("network/explorer/index.ts", () => {
    describe("getExplorerApi", () => {
      it("should throw when requesting a non existing explorer", () => {
        try {
          getExplorerApi(configFor("anything-coin"), { id: "anything-coin" } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownExplorer);
        }
      });

      it("should return the etherscan api", () => {
        const explorerA = getExplorerApi(configFor("etherscan-coin"), {
          id: "etherscan-coin",
        } as any);
        const explorerB = getExplorerApi(configFor("blockscout-coin"), {
          id: "blockscout-coin",
        } as any);

        expect(explorerA).toBe(etherscanLikeApi.explorerApi);
        expect(explorerB).toBe(etherscanLikeApi.explorerApi);
      });

      it("should return the no cache etherscan api", () => {
        const explorerA = getExplorerApi(configFor("etherscan-coin-no-cache"), {
          id: "etherscan-coin-no-cache",
        } as any);
        const explorerB = getExplorerApi(configFor("blockscout-coin-no-cache"), {
          id: "blockscout-coin-no-cache",
        } as any);

        expect(explorerA).toBe(etherscanLikeApi.explorerApiNoCache);
        expect(explorerB).toBe(etherscanLikeApi.explorerApiNoCache);
      });

      it("should return the ledger api", () => {
        const explorerA = getExplorerApi(configFor("ledger-coin"), { id: "ledger-coin" } as any);

        expect(explorerA).toBe(ledgerExplorerApi);
      });
    });
  });
});
