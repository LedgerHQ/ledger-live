import { capabilityReport } from "@ledgerhq/coin-module-framework/test-utils";
import type { StacksContext } from "../config";
import { createApi } from "./index";

const context: StacksContext = {
  config: async () => ({
    status: { type: "active" as const },
    config_currency_stacks: {
      type: "object" as const,
      default: { status: { type: "active" as const } },
    },
  }),
  logger: () => {},
};

describe("createApi", () => {
  const api = createApi();

  // Absent, raising "<name> is not supported" through the resolver — exhaustive by `toEqual`.
  it("omits the capabilities the chain has none of", async () => {
    await expect(capabilityReport(api, context)).resolves.toEqual({
      unsupported: ["call", "craftRawTransaction", "getRewards", "getValidators", "register"],
      inconsistent: [],
    });
  });

  it("throws if combine receives anything other than exactly one signature", () => {
    expect(() => api.combine(context, "0xdeadbeef", [])).toThrow(
      "combine expects exactly one signature",
    );
    expect(() => api.combine(context, "0xdeadbeef", ["sig1", "sig2"])).toThrow(
      "combine expects exactly one signature",
    );
  });

  it("validates a well-formed address", async () => {
    await expect(
      api.validateAddress(context, "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9", {
        currencyId: "stacks",
        networkId: 0,
      }),
    ).resolves.toBe(true);
  });

  it("getBalance rejects unsupported options without reaching the network", async () => {
    await expect(
      api.getBalance(context, "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9", {
        includeAssets: async () => true,
      }),
    ).rejects.toThrow("getBalance does not support the options parameter");
  });
});
