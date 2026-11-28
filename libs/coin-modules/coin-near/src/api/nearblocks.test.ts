import { getNetworkState } from "@ledgerhq/live-network";
import { http, HttpResponse } from "msw";
import { mockServer, NEAR_BASE_URL_MOCKED } from "../network/node.mock";
import { createMockNearContext } from "../test/context";
import { createApi } from "./index";

// The generic coin-framework bridge reaches nearblocks through this API, not through the account
// bridge: these cases prove the 429 policy holds on that path too.

const ADDRESS = "e5a6fb8d4f1ec0c4a7a5ef3a5e7bd14d4a42b2a0a4b3c2d1e0f9a8b7c6d5e4f3";

const counting = (path: string, status: number): { requests: () => number } => {
  let requests = 0;
  mockServer.use(
    http.get(`${NEAR_BASE_URL_MOCKED}${path}`, () => {
      requests += 1;
      return HttpResponse.json({ message: "refused" }, { status });
    }),
  );
  return { requests: () => requests };
};

describe("createApi against a refusing nearblocks", () => {
  const api = createApi();
  const context = createMockNearContext();

  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("listOperations rejects after one history request on a 429", async () => {
    const history = counting(`/v3/accounts/${ADDRESS}/txns`, 429);

    await expect(api.listOperations(context, ADDRESS, { minHeight: 0 })).rejects.toMatchObject({
      status: 429,
    });
    expect(history.requests()).toBe(1);
  });

  it("listOperations still retries the history on a 503", async () => {
    const history = counting(`/v3/accounts/${ADDRESS}/txns`, 503);

    await expect(api.listOperations(context, ADDRESS, { minHeight: 0 })).rejects.toMatchObject({
      status: 503,
    });
    expect(history.requests()).toBe(getNetworkState().getCallsRetry + 1);
  });

  it("getBalance rejects after one staking-deposits request on a 429", async () => {
    const listing = counting(`/v3/kitwallet/staking-deposits/${ADDRESS}`, 429);

    await expect(api.getBalance(context, ADDRESS)).rejects.toMatchObject({ status: 429 });
    expect(listing.requests()).toBe(1);
  });

  it("getValidators rejects after one validators request on a 429", async () => {
    const validators = counting("/v3/validators", 429);

    await expect(api.getValidators(context)).rejects.toMatchObject({ status: 429 });
    expect(validators.requests()).toBe(1);
  });
});
