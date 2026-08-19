import { AssertionError, fail } from "assert";
import { UnknownNode } from "../../errors";
import { getNodeApi } from "./index";

describe("EVM Family", () => {
  describe("network/node/index.ts", () => {
    describe("getNodeApi", () => {
      it("should throw when requesting a non existing node type", async () => {
        try {
          getNodeApi(
            {
              node: { type: "anything", uri: "notworking" },
            } as any,
            { id: "not-existing" } as any,
          );
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(UnknownNode);
        }
      });

      it("should return the rpc api", async () => {
        const node = getNodeApi(
          {
            node: { type: "external", uri: "working" },
          } as any,
          { id: "external" } as any,
        );

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
        const node = getNodeApi(
          {
            node: { type: "ledger", explorerId: "eth" },
          } as any,
          { id: "ledger-supported" } as any,
        );

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
