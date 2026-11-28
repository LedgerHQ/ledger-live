import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useSettingsGateViewModel } from "./useSettingsGateViewModel";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

describe("useSettingsGateViewModel", () => {
  it("reads the newSettings flag", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderHook(() => useSettingsGateViewModel("security"));

    expect(mockUseFeature).toHaveBeenCalledWith("newSettings");
  });

  it("opens the section of the address when the flag is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useSettingsGateViewModel("security"));

    expect(result.current).toEqual({
      showLegacySettings: false,
      selectedSection: "security",
      standalonePage: null,
    });
  });

  it("opens Help as a standalone page when the flag is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    const { result } = renderHook(() => useSettingsGateViewModel("help"));

    expect(result.current.showLegacySettings).toBe(false);
    expect(result.current.standalonePage).toBe("help");
  });

  it("keeps the legacy Settings when the flag is off or missing", () => {
    mockUseFeature.mockReturnValue({ enabled: false });
    expect(renderHook(() => useSettingsGateViewModel("")).result.current.showLegacySettings).toBe(
      true,
    );

    mockUseFeature.mockReturnValue(null);
    expect(renderHook(() => useSettingsGateViewModel("")).result.current.showLegacySettings).toBe(
      true,
    );
  });
});
