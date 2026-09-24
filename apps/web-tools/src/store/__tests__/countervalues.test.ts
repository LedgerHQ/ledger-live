/**
 * @jest-environment node
 */
import { getEnv, setEnv } from "@shared/env";
import { marketCountervaluesApi } from "@domain/api-market-countervalues";

// calApiExtra rejects an empty client version when the store is created, and its default is empty.
setEnv("LEDGER_CLIENT_VERSION", "web-tools-test");

type Store = (typeof import("../index"))["store"];

describe("web-tools store: countervalues", () => {
  let store: Store;

  beforeAll(async () => {
    ({ store } = await import("../index"));
  });

  it("registers the shared countervalues slice", () => {
    expect(store.getState()).toHaveProperty(marketCountervaluesApi.reducerPath);
  });

  it("wires the countervalues service, so a rate fetch reaches it and resolves", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ bitcoin: 9000 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await store.dispatch(
      marketCountervaluesApi.endpoints.getSpotRates.initiate(
        { to: "USD", froms: ["bitcoin"] },
        { forceRefetch: true },
      ),
    );

    expect(result.data).toEqual({ bitcoin: 9000 });
    expect((fetchSpy.mock.calls[0][0] as Request).url).toContain(
      "https://countervalues.live.ledger.com/v3/spot/simple",
    );
    fetchSpy.mockRestore();
  });

  it("follows a runtime switch of the service url, as the developer staging toggle does", async () => {
    const production = getEnv("LEDGER_COUNTERVALUES_API");
    const requested: string[] = [];
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(input => {
      requested.push((input as Request).url);
      return Promise.resolve(
        new Response(JSON.stringify({ bitcoin: 9000 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    setEnv("LEDGER_COUNTERVALUES_API", "https://countervalues.staging.test");
    try {
      await store.dispatch(
        marketCountervaluesApi.endpoints.getSpotRates.initiate(
          { to: "USD", froms: ["bitcoin"] },
          { forceRefetch: true },
        ),
      );
    } finally {
      setEnv("LEDGER_COUNTERVALUES_API", production);
      fetchSpy.mockRestore();
    }

    expect(requested).toEqual([
      expect.stringContaining("https://countervalues.staging.test/v3/spot/simple"),
    ]);
  });
});
