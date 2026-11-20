import { renderHook } from "@testing-library/react";
import type { PartialFeatures } from "@shared/feature-flags";
import { createTestWrapper } from "../../testing/createTestWrapper";
import { useAgentIntentEntryPoints } from "../useAgentIntentEntryPoints";

function renderEntryPoints(flags: PartialFeatures) {
  return renderHook(useAgentIntentEntryPoints, { wrapper: createTestWrapper(flags) });
}

describe("useAgentIntentEntryPoints", () => {
  it("should enable both entry points when the A/B test runs them together", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: true, profile: true, newBadge: false } },
    });

    expect(result.current).toEqual({
      isNavBarEnabled: true,
      isProfileEnabled: true,
      showNewBadge: false,
    });
  });

  it("should enable only the nav bar entry point", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: true, profile: false, newBadge: false } },
    });

    expect(result.current).toEqual({
      isNavBarEnabled: true,
      isProfileEnabled: false,
      showNewBadge: false,
    });
  });

  it("should enable only the profile entry point", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: false, profile: true, newBadge: false } },
    });

    expect(result.current).toEqual({
      isNavBarEnabled: false,
      isProfileEnabled: true,
      showNewBadge: false,
    });
  });

  it("should hide every entry point when the flag is off", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: false, params: { navBar: true, profile: true, newBadge: false } },
    });

    expect(result.current).toEqual({
      isNavBarEnabled: false,
      isProfileEnabled: false,
      showNewBadge: false,
    });
  });

  it("should hide every entry point by default", () => {
    const { result } = renderEntryPoints({});

    expect(result.current).toEqual({
      isNavBarEnabled: false,
      isProfileEnabled: false,
      showNewBadge: false,
    });
  });

  it("should show the new badge when the flag asks for it", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: false, profile: true, newBadge: true } },
    });

    expect(result.current.showNewBadge).toBe(true);
  });

  it("should hide the new badge when the flag is off", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: false, params: { navBar: false, profile: true, newBadge: true } },
    });

    expect(result.current.showNewBadge).toBe(false);
  });
});
