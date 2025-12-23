import { ApiPromise, HttpProvider } from "@polkadot/api";
import type { ApiOptions } from "@polkadot/api/types";
import { fetchValidators } from "./validators";
import getApiPromise from "./apiPromise";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

jest.mock("./apiPromise");

describe("fetchValidators", () => {
  let provider: HttpProvider;
  beforeAll(async () => {
    provider = new HttpProvider("https://polkadot-rpc.publicnode.com");
    const api = await ApiPromise.create({
      provider: provider as NonNullable<ApiOptions["provider"]>,
      noInitWarn: true,
    });
    (getApiPromise as jest.Mock).mockResolvedValue(api);
  });

  it("should not exceed 40 RPC API calls to fetch all validators", async () => {
    const result = await fetchValidators(undefined, undefined, getCryptoCurrencyById("polkadot"));
    expect(result.length).toBeGreaterThan(300);
    const requestCount = provider.stats.total.requests;
    expect(requestCount).toBeGreaterThan(0); // should have made at least one request
    expect(requestCount).toBeLessThanOrEqual(40); // should not exceed 50 requests
  });
});
