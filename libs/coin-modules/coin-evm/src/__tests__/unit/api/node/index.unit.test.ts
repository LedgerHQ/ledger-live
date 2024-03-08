import { AssertionError, fail } from "assert";
import ledgerNodeApi from "../../../../api/node/ledger";
import rpcNodeApi from "../../../../api/node/rpc";
import { getNodeApi } from "../../../../api/node";
import { UnknownNode } from "../../../../errors";
import { getCoinConfig } from "../../../../config";

jest.mock("../../../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  describe("api/node/index.ts", () => {
    describe("getNodeApi", () => {
      it("should throw when requesting a non existing node type", async () => {
        mockGetConfig.mockImplementation((): any => {
          return { info: { node: { type: "anything", uri: "notworking" } } };
        });

        try {
          await getNodeApi({
            id: "not-existing",
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
        mockGetConfig.mockImplementationOnce((): any => {
          return { info: { node: { type: "external", uri: "working" } } };
        });

        const node = await getNodeApi({
          id: "external",
        } as any);

        expect(node).toBe(rpcNodeApi);
      });

      it("should return the ledger api", async () => {
        mockGetConfig.mockImplementationOnce((): any => {
          return { info: { node: { type: "ledger", explorerId: "eth" } } };
        });

        const node = await getNodeApi({
          id: "ledger-supported",
        } as any);

        expect(node).toBe(ledgerNodeApi);
      });
    });
  });
});
