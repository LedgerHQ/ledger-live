import { AssertionError, fail } from "assert";
import ledgerNodeApi from "../../../../api/node/ledger";
import rpcNodeApi from "../../../../api/node/rpc";
import { getNodeApi } from "../../../../api/node";
import { UnknownNode } from "../../../../errors";

describe("EVM Family", () => {
  describe("api/node/index.ts", () => {
    describe("getNodeApi", () => {
      it("should throw when requesting a non existing node type", async () => {
        try {
          await getNodeApi({
            id: "not-existing",
            ethereumLikeInfo: { node: { type: "anything", uri: "notworking" } },
          } as any);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownNode);
        }
      });

      it("should return the rpc api", async () => {
        const node = await getNodeApi({
          ethereumLikeInfo: { node: { type: "external", uri: "working" } },
        } as any);

        expect(node).toBe(rpcNodeApi);
      });

      it("should return the ledger api", async () => {
        const node = await getNodeApi({
          ethereumLikeInfo: { node: { type: "ledger", explorerId: "eth" } },
        } as any);

        expect(node).toBe(ledgerNodeApi);
      });
    });
  });
});
