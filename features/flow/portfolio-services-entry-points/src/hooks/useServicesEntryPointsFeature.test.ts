import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useServicesEntryPointsFeature } from "./useServicesEntryPointsFeature";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

function mockFlags(flags: Record<string, unknown>) {
  mockUseFeature.mockImplementation(key => (flags[key] ?? null) as ReturnType<typeof useFeature>);
}

describe("useServicesEntryPointsFeature", () => {
  it("is enabled even when no service is available, so the legacy entry points stay hidden", () => {
    mockFlags({ entryPointsServices: { enabled: true, params: { services: ["perps"] } } });

    const { result } = renderHook(() => useServicesEntryPointsFeature());

    expect(result.current).toEqual({ isEnabled: true, services: [] });
  });

  it("returns no service when the flag is off", () => {
    mockFlags({
      entryPointsServices: { enabled: false, params: { services: ["perps"] } },
      ptxPerpsLiveApp: { enabled: true },
    });

    const { result } = renderHook(() => useServicesEntryPointsFeature());

    expect(result.current).toEqual({ isEnabled: false, services: [] });
  });

  it("returns no service when the flag is not loaded", () => {
    mockFlags({});

    const { result } = renderHook(() => useServicesEntryPointsFeature());

    expect(result.current).toEqual({ isEnabled: false, services: [] });
  });
});
