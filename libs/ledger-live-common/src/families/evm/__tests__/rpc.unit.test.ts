import { AssertionError } from "assert";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { DEFAULT_RETRIES_RPC_METHODS, withApi } from "../api/rpc.common";

const fakeCurrency: Partial<CryptoCurrency> = {
  id: "my_new_chain",
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "my-rpc.com",
  },
};

describe("EVM Family", () => {
  describe("api/Evm.ts", () => {
    describe("withApi", () => {
      it("should retry on fail as many times as the DEFAULT_RETRIES_RPC_METHODS constant is set to", async () => {
        let retries = DEFAULT_RETRIES_RPC_METHODS;
        const spy = jest.fn(async () => {
          if (retries) {
            --retries;
            throw new Error();
          }
          return true;
        });
        const response = await withApi(fakeCurrency as CryptoCurrency, spy);

        expect(response).toBe(true);
        // it should fail DEFAULT_RETRIES_RPC_METHODS times and succeed on the next try, therefore the +1
        expect(spy).toBeCalledTimes(DEFAULT_RETRIES_RPC_METHODS + 1);
      });

      it("should throw after too many retries", async () => {
        const SpyError = class SpyError extends Error {};

        let retries = DEFAULT_RETRIES_RPC_METHODS + 1;
        const spy = jest.fn(async () => {
          if (retries) {
            --retries;
            throw new SpyError();
          }
          return true;
        });

        try {
          await withApi(fakeCurrency as CryptoCurrency, spy);
          fail("Promise should have been rejected");
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          expect(e).toBeInstanceOf(SpyError);
        }
      });
    });
  });
});
