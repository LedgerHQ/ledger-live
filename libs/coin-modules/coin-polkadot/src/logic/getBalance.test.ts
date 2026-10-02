import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { PolkadotCoinConfig } from "../config";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import { getBalance } from "./getBalance";

describe("getBalance", () => {
  const mockServer = setupServer();
  const config: PolkadotCoinConfig = {
    ...polkadotMainnetConfigValue,
    sidecar: { url: "http://polkadot.explorer.com" },
  };
  it("gets the balance of a Polkadot account", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.get(
        "http://polkadot.explorer.com/accounts/1a1LcBX6hGPKg5aQ6DXZpAHCCzWjckhea4sz3P1PvL3oc4F/balance-info",
        () => HttpResponse.json({ locks: [], free: 100, at: { height: 10 } }),
      ),
    );

    expect(await getBalance(config, "1a1LcBX6hGPKg5aQ6DXZpAHCCzWjckhea4sz3P1PvL3oc4F")).toEqual([
      { value: BigInt(100), asset: { type: "native" } },
    ]);
  });
});
