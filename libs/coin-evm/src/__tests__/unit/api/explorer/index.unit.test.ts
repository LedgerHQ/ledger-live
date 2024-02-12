import { AssertionError, fail } from "assert";
import etherscanLikeApi from "../../../../api/explorer/etherscan";
import ledgerExplorerApi from "../../../../api/explorer/ledger";
import { getExplorerApi } from "../../../../api/explorer";
import { UnknownExplorer } from "../../../../errors";

describe("EVM Family", () => {
  describe("api/explorer/index.ts", () => {
    describe("getExplorerApi", () => {
      it("should throw when requesting a non existing explorer", () => {
        try {
          getExplorerApi({
            id: "not-existing",
            ethereumLikeInfo: { explorer: { type: "anything", uri: "notworking" } },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownExplorer);
        }
      });

      it("should return the etherscan api", () => {
        const explorerA = getExplorerApi({
          ethereumLikeInfo: { explorer: { type: "etherscan", uri: "working" } },
        } as any);
        const explorerB = getExplorerApi({
          ethereumLikeInfo: { explorer: { type: "blockscout", uri: "working" } },
        } as any);

        expect(explorerA).toBe(etherscanLikeApi);
        expect(explorerB).toBe(etherscanLikeApi);
      });

      it("should return the ledger api", () => {
        const explorerA = getExplorerApi({
          ethereumLikeInfo: { explorer: { type: "ledger", explorerId: "eth" } },
        } as any);

        expect(explorerA).toBe(ledgerExplorerApi);
      });
    });
  });
});
