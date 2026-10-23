import { renderHook } from "@testing-library/react";
import type { PartialFeatures } from "@shared/feature-flags";
import { createTestWrapper } from "../testing/createTestWrapper";
import { useServicesEntryPointsFeature } from "./useServicesEntryPointsFeature";

const AVAILABLE_SERVICES: PartialFeatures = {
  ptxPerpsLiveApp: { enabled: true, params: { manifest_id: "perps-live-app" } },
  ptxBorrowLiveApp: { enabled: true },
};

function renderFeature(flags: PartialFeatures, options?: { isAssetSectionDisplayed: boolean }) {
  return renderHook(useServicesEntryPointsFeature, {
    wrapper: createTestWrapper({ ...AVAILABLE_SERVICES, ...flags }, options),
  });
}

describe("useServicesEntryPointsFeature", () => {
  it("should return the available services in the flag order", () => {
    const { result } = renderFeature({
      entryPointsServices: { enabled: true, params: { services: ["borrow", "perps"] } },
    });

    expect(result.current).toEqual({ isEnabled: true, services: ["borrow", "perps"] });
  });

  it("should stay enabled when no service is available so the legacy entry points stay hidden", () => {
    const { result } = renderFeature({
      entryPointsServices: { enabled: true, params: { services: ["perps"] } },
      ptxPerpsLiveApp: { enabled: false, params: { manifest_id: "perps-live-app" } },
    });

    expect(result.current).toEqual({ isEnabled: true, services: [] });
  });

  it("should be disabled when the flag is off", () => {
    const { result } = renderFeature({
      entryPointsServices: { enabled: false, params: { services: ["perps"] } },
    });

    expect(result.current).toEqual({ isEnabled: false, services: [] });
  });

  it("should be disabled when the asset section is hidden", () => {
    const { result } = renderFeature(
      { entryPointsServices: { enabled: true, params: { services: ["perps"] } } },
      { isAssetSectionDisplayed: false },
    );

    expect(result.current).toEqual({ isEnabled: false, services: [] });
  });
});
