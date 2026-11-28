import { renderHook } from "@testing-library/react";
import { useFeature } from "@features/platform-feature-flags";
import { useWalletApiSignAssignment, useWalletApiSignEnabled } from "../useWalletApiSignAssignment";

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

const mockedUseFeature = jest.mocked(useFeature);

describe("useWalletApiSignAssignment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns inactive defaults when the flag is null", () => {
    mockedUseFeature.mockReturnValue(null);

    const { result } = renderHook(() =>
      useWalletApiSignAssignment("lldWalletApiDeviceIntentSign", "swap-live-app"),
    );

    expect(mockedUseFeature).toHaveBeenCalledWith("lldWalletApiDeviceIntentSign");
    expect(result.current).toEqual({
      enabled: false,
      variantId: undefined,
      active: false,
    });
  });

  it("returns active false when the flag is disabled even if the manifest is allowlisted", () => {
    mockedUseFeature.mockReturnValue({
      enabled: false,
      params: { variantId: "control", enabledManifestIds: ["swap-live-app"] },
    });

    const { result } = renderHook(() =>
      useWalletApiSignAssignment("lldWalletApiDeviceIntentSign", "swap-live-app"),
    );

    expect(result.current).toEqual({
      enabled: false,
      variantId: "control",
      active: false,
    });
  });

  it("returns active true when enabled and the manifest is in enabledManifestIds", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
    });

    const { result } = renderHook(() =>
      useWalletApiSignAssignment("lldWalletApiDeviceIntentSign", "swap-live-app"),
    );

    expect(result.current).toEqual({
      enabled: true,
      variantId: "variant_a",
      active: true,
    });
  });

  it("returns active false when enabled and the manifest is not in enabledManifestIds", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
    });

    const { result } = renderHook(() =>
      useWalletApiSignEnabled("llmWalletApiDeviceIntentSign", "earn"),
    );

    expect(result.current).toBe(false);
  });

  it("does not treat '*' as a wildcard for every manifest", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["*"] },
    });

    const { result } = renderHook(() =>
      useWalletApiSignEnabled("lldWalletApiDeviceIntentSign", "any-live-app"),
    );

    expect(result.current).toBe(false);
  });

  it("activates only the exact '*' manifest id when it is listed", () => {
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["*"] },
    });

    const { result } = renderHook(() =>
      useWalletApiSignEnabled("lldWalletApiDeviceIntentSign", "*"),
    );

    expect(result.current).toBe(true);
  });

  it("keeps a stable assignment object reference when inputs do not change", () => {
    const flag = {
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
    };
    mockedUseFeature.mockReturnValue(flag);

    const { result, rerender } = renderHook(
      ({ manifestId }) => useWalletApiSignAssignment("lldWalletApiDeviceIntentSign", manifestId),
      { initialProps: { manifestId: "swap-live-app" } },
    );

    const first = result.current;
    rerender({ manifestId: "swap-live-app" });

    expect(result.current).toBe(first);
  });
});
