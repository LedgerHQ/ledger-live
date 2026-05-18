import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import coinConfig, { PolkadotCoinConfig } from "../config";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  const mockServer = setupServer();
  coinConfig.setCoinConfig(
    () =>
      ({
        status: { type: "active" },
        sidecar: { url: "http://polkadot.explorer.com" },
      }) as unknown as PolkadotCoinConfig,
  );
  it("gets the balance of a Polkadot account", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.get(
        "http://polkadot.explorer.com/accounts/1a1LcBX6hGPKg5aQ6DXZpAHCCzWjckhea4sz3P1PvL3oc4F/balance-info",
        () => HttpResponse.json({ locks: [], free: 100, at: { height: 10 } }),
      ),
    );

    expect(await getBalance("1a1LcBX6hGPKg5aQ6DXZpAHCCzWjckhea4sz3P1PvL3oc4F")).toEqual([
      { value: BigInt(100), asset: { type: "native" } },
    ]);
  });

  describe("Bittensor", () => {
    // Bittensor uses SS58 address prefix 42 (generic Substrate)
    const bittensorAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

    beforeEach(() => {
      coinConfig.setCoinConfig(
        () =>
          ({
            status: { type: "active" },
            sidecar: { url: "http://bittensor-sidecar.test" },
          }) as unknown as PolkadotCoinConfig,
      );
    });

    afterAll(() => {
      // Restore Polkadot config so other tests are not affected
      coinConfig.setCoinConfig(
        () =>
          ({
            status: { type: "active" },
            sidecar: { url: "http://polkadot.explorer.com" },
          }) as unknown as PolkadotCoinConfig,
      );
      mockServer.close();
    });

    it("gets the balance of a Bittensor account", async () => {
      mockServer.use(
        http.get(
          `http://bittensor-sidecar.test/accounts/${bittensorAddress}/balance-info`,
          () =>
            HttpResponse.json({
              locks: [],
              free: 1000000000,
              at: { height: 4000000 },
            }),
        ),
      );

      expect(await getBalance(bittensorAddress)).toEqual([
        { value: BigInt(1000000000), asset: { type: "native" } },
      ]);
    });

    it("returns zero balance for an empty Bittensor account", async () => {
      mockServer.use(
        http.get(
          `http://bittensor-sidecar.test/accounts/${bittensorAddress}/balance-info`,
          () =>
            HttpResponse.json({
              locks: [],
              free: 0,
              at: { height: 4000000 },
            }),
        ),
      );

      expect(await getBalance(bittensorAddress)).toEqual([
        { value: BigInt(0), asset: { type: "native" } },
      ]);
    });
  });
});
