import { renderHook } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useIsSettingsHomeEnabled } from "./useIsSettingsHomeEnabled";
import { useSettingsHomeGateViewModel } from "./useSettingsHomeGateViewModel";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));

const mockUseFeature = jest.mocked(useFeature);

describe("useSettingsHomeGateViewModel", () => {
  it("reads the newSettings flag", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderHook(() => useSettingsHomeGateViewModel());

    expect(mockUseFeature).toHaveBeenCalledWith("newSettings");
  });

  it("shows the new home when the flag is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    expect(renderHook(() => useSettingsHomeGateViewModel()).result.current).toEqual({
      showLegacySettings: false,
    });
    expect(renderHook(() => useIsSettingsHomeEnabled()).result.current).toBe(true);
  });

  it.each([{ enabled: false }, null])(
    "keeps the legacy home when the flag is off or missing (%p)",
    flag => {
      mockUseFeature.mockReturnValue(flag);

      expect(renderHook(() => useSettingsHomeGateViewModel()).result.current).toEqual({
        showLegacySettings: true,
      });
      expect(renderHook(() => useIsSettingsHomeEnabled()).result.current).toBe(false);
    },
  );
});
