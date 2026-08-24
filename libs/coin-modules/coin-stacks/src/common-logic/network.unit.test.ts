import { setEnv } from "@ledgerhq/live-env";
import { getConfiguredStacksNetwork } from "./network";

describe("getConfiguredStacksNetwork", () => {
  afterEach(() => {
    setEnv("API_STACKS_NETWORK", "");
  });

  it("defaults to mainnet when API_STACKS_NETWORK is unset", () => {
    expect(getConfiguredStacksNetwork()).toBe("mainnet");
  });

  it.each(["testnet", "devnet", "mocknet"] as const)(
    "picks up a valid API_STACKS_NETWORK override (%s)",
    network => {
      setEnv("API_STACKS_NETWORK", network);
      expect(getConfiguredStacksNetwork()).toBe(network);
    },
  );

  it("falls back to mainnet for an invalid API_STACKS_NETWORK value", () => {
    setEnv("API_STACKS_NETWORK", "not-a-real-network");
    expect(getConfiguredStacksNetwork()).toBe("mainnet");
  });
});
