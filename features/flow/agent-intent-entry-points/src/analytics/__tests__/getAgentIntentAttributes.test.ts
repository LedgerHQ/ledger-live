import { getAgentIntentAttributes } from "../getAgentIntentAttributes";

describe("getAgentIntentAttributes", () => {
  it("should report both entry points when the A/B test runs them together", () => {
    expect(
      getAgentIntentAttributes({
        enabled: true,
        params: { navBar: true, profile: true, newBadge: false },
      }),
    ).toEqual({ isEnabled: true, entryPoints: ["nav_bar", "profile"], newBadge: false });
  });

  it("should report only the enabled entry point", () => {
    expect(
      getAgentIntentAttributes({
        enabled: true,
        params: { navBar: false, profile: true, newBadge: false },
      }),
    ).toEqual({ isEnabled: true, entryPoints: ["profile"], newBadge: false });
  });

  it("should report no entry point when the flag is off", () => {
    expect(
      getAgentIntentAttributes({
        enabled: false,
        params: { navBar: true, profile: true, newBadge: false },
      }),
    ).toEqual({ isEnabled: false, entryPoints: [], newBadge: false });
  });

  it("should report a disabled flag when the flag is not loaded", () => {
    expect(getAgentIntentAttributes(null)).toEqual({
      isEnabled: false,
      entryPoints: [],
      newBadge: false,
    });
  });

  it("should report the new badge when the flag shows it", () => {
    expect(
      getAgentIntentAttributes({
        enabled: true,
        params: { navBar: false, profile: true, newBadge: true },
      }),
    ).toEqual({ isEnabled: true, entryPoints: ["profile"], newBadge: true });
  });

  it("should not report the new badge when the flag is off", () => {
    expect(
      getAgentIntentAttributes({
        enabled: false,
        params: { navBar: false, profile: true, newBadge: true },
      }),
    ).toEqual({ isEnabled: false, entryPoints: [], newBadge: false });
  });
});
