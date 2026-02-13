import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getEnv } from "@ledgerhq/live-env";
import { createApi } from "../api";

describe("createApi", () => {
  const api = createApi(
    {
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
    },
    "aleo",
  );

  beforeAll(() => {
    setupCalClientStore();
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBeGreaterThan(0);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getBalance", () => {
    it("returns the balance for a valid address", async () => {
      const address = "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f";
      const balance = await api.getBalance(address);

      expect(Array.isArray(balance)).toBe(true);
      expect(balance.length).toBeGreaterThanOrEqual(0);
    });

    it("throws an error for an invalid address", async () => {
      const invalidAddress = "invalid_address";

      await expect(api.getBalance(invalidAddress)).rejects.toThrow();
    });
  });
});
