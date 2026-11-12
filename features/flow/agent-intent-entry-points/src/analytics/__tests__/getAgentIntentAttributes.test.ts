import { getAgentIntentAttributes } from "../getAgentIntentAttributes";

describe("getAgentIntentAttributes", () => {
  it("should report both entry points when the A/B test runs them together", () => {
    expect(
      getAgentIntentAttributes({ enabled: true, params: { navBar: true, profile: true } }),
    ).toEqual({ isEnabled: true, entryPoints: ["nav_bar", "profile"] });
  });

  it("should report only the enabled entry point", () => {
    expect(
      getAgentIntentAttributes({ enabled: true, params: { navBar: false, profile: true } }),
    ).toEqual({ isEnabled: true, entryPoints: ["profile"] });
  });

  it("should report no entry point when the flag is off", () => {
    expect(
      getAgentIntentAttributes({ enabled: false, params: { navBar: true, profile: true } }),
    ).toEqual({ isEnabled: false, entryPoints: [] });
  });

  it("should report a disabled flag when the flag is not loaded", () => {
    expect(getAgentIntentAttributes(null)).toEqual({ isEnabled: false, entryPoints: [] });
  });
});
