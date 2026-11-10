import { renderHook } from "@tests/test-renderer";
import { useFeature } from "@features/platform-feature-flags";
import {
  useDeviceIntentExchangeAssignment,
  useDeviceIntentExchangeEnabled,
} from "../useDeviceIntentExchangeEnabled";

jest.mock("@features/platform-feature-flags", () => ({
  ...jest.requireActual("@features/platform-feature-flags"),
  useFeature: jest.fn(),
}));

function mockFlag(
  flag: { enabled: boolean; params?: { enabledManifestIds: string[]; variantId?: string } } | null,
) {
  jest.mocked(useFeature).mockReturnValue(flag as never);
}

describe("useDeviceIntentExchangeEnabled", () => {
  it("reads the flag of the exchange device intent", () => {
    mockFlag(null);

    renderHook(() => useDeviceIntentExchangeEnabled("swap-live-app"));

    expect(useFeature).toHaveBeenCalledWith("llmWalletApiDeviceIntentExchange");
  });

  it("is on for a live app that is listed while the flag is on", () => {
    mockFlag({ enabled: true, params: { enabledManifestIds: ["swap-live-app", "sell-live-app"] } });

    const { result } = renderHook(() => useDeviceIntentExchangeEnabled("swap-live-app"));

    expect(result.current).toBe(true);
  });

  it("is on for every live app when the allowlist has a wildcard", () => {
    mockFlag({ enabled: true, params: { enabledManifestIds: ["*"] } });

    const { result } = renderHook(() => useDeviceIntentExchangeEnabled("any-live-app"));

    expect(result.current).toBe(true);
  });

  it("is off for a live app that is not listed", () => {
    mockFlag({ enabled: true, params: { enabledManifestIds: ["swap-live-app"] } });

    const { result } = renderHook(() => useDeviceIntentExchangeEnabled("earn-live-app"));

    expect(result.current).toBe(false);
  });

  it("is off for every live app while the flag is off, even with a wildcard", () => {
    mockFlag({ enabled: false, params: { enabledManifestIds: ["*", "swap-live-app"] } });

    const { result } = renderHook(() => useDeviceIntentExchangeEnabled("swap-live-app"));

    expect(result.current).toBe(false);
  });

  it("is off when the flag is not there at all", () => {
    mockFlag(null);

    const { result } = renderHook(() => useDeviceIntentExchangeEnabled("swap-live-app"));

    expect(result.current).toBe(false);
  });
});

describe("useDeviceIntentExchangeAssignment", () => {
  it("reports the flag state and the variant, whatever the live app", () => {
    mockFlag({ enabled: true, params: { variantId: "variant_a", enabledManifestIds: ["other"] } });

    const { result } = renderHook(() => useDeviceIntentExchangeAssignment("swap-live-app"));

    expect(result.current).toEqual({ enabled: true, variantId: "variant_a", active: false });
  });

  it("is active for a listed live app", () => {
    mockFlag({
      enabled: true,
      params: { variantId: "variant_a", enabledManifestIds: ["swap-live-app"] },
    });

    const { result } = renderHook(() => useDeviceIntentExchangeAssignment("swap-live-app"));

    expect(result.current).toEqual({ enabled: true, variantId: "variant_a", active: true });
  });

  it("keeps the variant while the flag is off", () => {
    mockFlag({
      enabled: false,
      params: { variantId: "control", enabledManifestIds: ["swap-live-app"] },
    });

    const { result } = renderHook(() => useDeviceIntentExchangeAssignment("swap-live-app"));

    expect(result.current).toEqual({ enabled: false, variantId: "control", active: false });
  });

  it("has no variant when the flag is missing", () => {
    mockFlag(null);

    const { result } = renderHook(() => useDeviceIntentExchangeAssignment("swap-live-app"));

    expect(result.current).toEqual({ enabled: false, variantId: undefined, active: false });
  });
});
