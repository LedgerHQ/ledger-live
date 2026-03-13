import { AssertionError, fail } from "assert";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import { getNodeApi } from "./index";

jest.mock("../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("EVM Family", () => {
  describe("network/node/index.ts", () => {
    describe("getNodeApi", () => {
      it("should throw when requesting a non existing node type", async () => {
        mockGetConfig.mockImplementation((): any => {
          return { info: { node: { type: "anything", uri: "notworking" } } };
        });

        try {
          getNodeApi({
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

        const node = getNodeApi({
          id: "external",
        } as any);

        expect(node).toEqual(
          expect.objectContaining({
            getTransaction: expect.any(Function),
            getBlockByHeight: expect.any(Function),
            getCoinBalance: expect.any(Function),
            getTransactionCount: expect.any(Function),
            getGasEstimation: expect.any(Function),
            getFeeData: expect.any(Function),
            broadcastTransaction: expect.any(Function),
            getOptimismAdditionalFees: expect.any(Function),
            getScrollAdditionalFees: expect.any(Function),
          }),
        );
      });

      it("should return the ledger api", () => {
        mockGetConfig.mockImplementationOnce((): any => {
          return { info: { node: { type: "ledger", explorerId: "eth" } } };
        });

        const node = getNodeApi({
          id: "ledger-supported",
        } as any);

        expect(node).toEqual(
          expect.objectContaining({
            getTransaction: expect.any(Function),
            getBlockByHeight: expect.any(Function),
            getCoinBalance: expect.any(Function),
            getTransactionCount: expect.any(Function),
            getGasEstimation: expect.any(Function),
            getFeeData: expect.any(Function),
            broadcastTransaction: expect.any(Function),
            getOptimismAdditionalFees: expect.any(Function),
            getScrollAdditionalFees: expect.any(Function),
          }),
        );
      });
    });
  });
});
