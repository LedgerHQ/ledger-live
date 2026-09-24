import coinConfig from "../config";
import { createMockKaspaContext, mockKaspaConfig } from "../test/context";
import { createApi } from ".";

describe("createApi", () => {
  const fetchSpy = jest.spyOn(global, "fetch");

  beforeEach(() => {
    // The api path must not depend on the module singleton, whatever it holds.
    coinConfig.setCoinConfig(() => {
      throw new Error("coin-config singleton read on the api path");
    });
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ transactionId: "txid" })));
  });

  afterEach(() => {
    coinConfig.setCoinConfig(() => mockKaspaConfig);
    fetchSpy.mockReset();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it("resolves the endpoint from the context config", async () => {
    const context = createMockKaspaContext({
      ...mockKaspaConfig,
      infra: { API_KASPA_ENDPOINT: "https://from-context.invalid" },
    });

    await expect(createApi().broadcast(context, "{}")).resolves.toBe("txid");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://from-context.invalid/transactions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
