import { edgeHeaders } from "./appNetworkLogStore";

describe("edgeHeaders", () => {
  it("keeps the cache status, the edge location, the remaining quota and a client prefix", () => {
    const headers = new Headers({
      "cf-cache-status": "HIT",
      "cf-ray": "a47cd77a39991b9b-DUB",
      "x-rate-limit-remaining": "499",
      "x-gravitee-client-identifier": "80c4b66e22795e0c306f382667e9dfd5",
    });

    expect(edgeHeaders(headers)).toEqual({
      cacheStatus: "HIT",
      edgeLocation: "DUB",
      rateLimitRemaining: 499,
      gatewayClient: "80c4b66e",
    });
  });

  it("leaves every field undefined when the headers are absent", () => {
    expect(edgeHeaders(new Headers())).toEqual({
      cacheStatus: undefined,
      edgeLocation: undefined,
      rateLimitRemaining: undefined,
      gatewayClient: undefined,
    });
  });

  it("never throws, since it runs inside the fetch wrapper", () => {
    const broken = {
      get: () => {
        throw new Error("boom");
      },
    } as unknown as Headers;

    expect(edgeHeaders(broken)).toEqual({});
    expect(edgeHeaders(undefined)).toEqual({
      cacheStatus: undefined,
      edgeLocation: undefined,
      rateLimitRemaining: undefined,
      gatewayClient: undefined,
    });
  });
});
