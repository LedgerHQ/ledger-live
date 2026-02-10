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
});
