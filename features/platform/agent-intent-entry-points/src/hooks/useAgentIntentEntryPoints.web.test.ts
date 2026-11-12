import { renderHook } from "@testing-library/react";
import type { PartialFeatures } from "@shared/feature-flags";
import { createTestWrapper } from "../testing/createTestWrapper";
import { useAgentIntentEntryPoints } from "./useAgentIntentEntryPoints";

function renderEntryPoints(flags: PartialFeatures) {
  return renderHook(useAgentIntentEntryPoints, { wrapper: createTestWrapper(flags) });
}

describe("useAgentIntentEntryPoints", () => {
  it("should enable both entry points when the A/B test runs them together", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: true, profile: true } },
    });

    expect(result.current).toEqual({ isNavBarEnabled: true, isProfileEnabled: true });
  });

  it("should enable only the nav bar entry point", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: true, profile: false } },
    });

    expect(result.current).toEqual({ isNavBarEnabled: true, isProfileEnabled: false });
  });

  it("should enable only the profile entry point", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: true, params: { navBar: false, profile: true } },
    });

    expect(result.current).toEqual({ isNavBarEnabled: false, isProfileEnabled: true });
  });

  it("should hide every entry point when the flag is off", () => {
    const { result } = renderEntryPoints({
      agentIntent: { enabled: false, params: { navBar: true, profile: true } },
    });

    expect(result.current).toEqual({ isNavBarEnabled: false, isProfileEnabled: false });
  });

  it("should hide every entry point by default", () => {
    const { result } = renderEntryPoints({});

    expect(result.current).toEqual({ isNavBarEnabled: false, isProfileEnabled: false });
  });
});
