import { agentIntent } from "./agentIntent";

describe("agentIntent", () => {
  it("should disable the flag and every entry point by default", () => {
    expect(agentIntent.parse(undefined)).toEqual({
      enabled: false,
      params: { navBar: false, profile: false },
    });
  });

  it("should keep both entry points enabled for the A/B test", () => {
    const result = agentIntent.parse({ enabled: true, params: { navBar: true, profile: true } });

    expect(result.params).toEqual({ navBar: true, profile: true });
  });

  it("should default a missing entry point to disabled", () => {
    const result = agentIntent.parse({ enabled: true, params: { navBar: true } });

    expect(result.params).toEqual({ navBar: true, profile: false });
  });
});
