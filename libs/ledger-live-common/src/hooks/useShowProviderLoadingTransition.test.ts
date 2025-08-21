/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { LiveAppManifest } from "../platform/types";
import { INTERNAL_APP_IDS } from "../wallet-api/constants";
import { useFeature } from "../featureFlags";
import { useInternalAppIds } from "./useInternalAppIds";

import { useShowProviderLoadingTransition } from "./useShowProviderLoadingTransition";

jest.mock("../featureFlags", () => ({
  useFeature: jest.fn(),
}));
jest.mock("../wallet-api/constants", () => ({
  INTERNAL_APP_IDS: ["internal-app-id-1", "internal-app-id-2"],
}));
jest.mock("./useInternalAppIds", () => ({
  useInternalAppIds: jest.fn(),
}));

describe("useShowProviderLoadingTransition", () => {
  const mockUseFeature = useFeature as jest.Mock;
  const mockUseInternalAppIds = useInternalAppIds as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return false when feature is disabled", () => {
    mockUseFeature.mockReturnValue({ enabled: false, params: {} });
    const { result } = renderHook(() =>
      useShowProviderLoadingTransition({
        manifest: { id: "test-app-id" } as LiveAppManifest,
        isLoading: true,
      }),
    );
    expect(result.current).toBe(false);
  });

  it("should return false for internal apps", () => {
    mockUseFeature.mockReturnValue({ enabled: true, params: {} });
    mockUseInternalAppIds.mockReturnValue(INTERNAL_APP_IDS);
    const { result } = renderHook(() =>
      useShowProviderLoadingTransition({
        manifest: { id: "internal-app-id-1" } as LiveAppManifest,
        isLoading: true,
      }),
    );
    expect(result.current).toBe(false);
  });

  it("should return true when loading and feature is enabled", () => {
    mockUseFeature.mockReturnValue({ enabled: true, params: {} });
    mockUseInternalAppIds.mockReturnValue([]);
    const { result } = renderHook(() =>
      useShowProviderLoadingTransition({
        manifest: { id: "test-app-id" } as LiveAppManifest,
        isLoading: true,
      }),
    );
    expect(result.current).toBe(true);
  });

  it("should handle extended loading state", () => {
    jest.useFakeTimers();
    mockUseFeature.mockReturnValue({ enabled: true, params: { durationMs: 1000 } });
    mockUseInternalAppIds.mockReturnValue([]);

    const { result, rerender } = renderHook(
      ({ isLoading }) =>
        useShowProviderLoadingTransition({
          manifest: { id: "test-app-id" } as LiveAppManifest,
          isLoading,
        }),
      {
        initialProps: { isLoading: true },
      },
    );

    expect(result.current).toBe(true);

    // Simulate the timeout
    jest.advanceTimersByTime(1000);

    rerender({ isLoading: false });

    expect(result.current).toBe(false);

    jest.useRealTimers();
  });
  it("should clear timeout on unmount", () => {
    jest.useFakeTimers();
    mockUseFeature.mockReturnValue({ enabled: true, params: { durationMs: 1000 } });
    mockUseInternalAppIds.mockReturnValue([]);

    const { unmount } = renderHook(() =>
      useShowProviderLoadingTransition({
        manifest: { id: "test-app-id" } as LiveAppManifest,
        isLoading: true,
      }),
    );

    unmount();

    // Advance timers to ensure no memory leaks
    jest.advanceTimersByTime(1000);

    jest.useRealTimers();
  });
});
