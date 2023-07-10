import { AssertionError, fail } from "assert";
import { getExplorerApi } from "../../../../api/explorer";
import etherscanLikeApi from "../../../../api/explorer/etherscan";

describe("EVM Family", () => {
  describe("api/explorer/index.ts", () => {
    describe("getExplorerApi", () => {
      it("should throw when requesting a non existing explorer", async () => {
        try {
          await getExplorerApi({
            id: "not-existing",
            ethereumLikeInfo: { explorer: { type: "anything", uri: "notworking" } },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect((e as Error).message).toEqual(`No explorer found for currency "not-existing"`);
        }
      });

      it("should return the etherscan api", async () => {
        const explorerA = await getExplorerApi({
          ethereumLikeInfo: { explorer: { type: "etherscan", uri: "working" } },
        } as any);
        const explorerB = await getExplorerApi({
          ethereumLikeInfo: { explorer: { type: "blockscout", uri: "working" } },
        } as any);

        expect(explorerA).toBe(etherscanLikeApi);
        expect(explorerB).toBe(etherscanLikeApi);
      });
    });
  });
});
