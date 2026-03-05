import { Linking, Platform } from "react-native";
import { renderHook, waitFor } from "@tests/test-renderer";
import { useIdAppDetection } from "../hooks/useIdAppDetection";

describe("useIdAppDetection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isInstalled=true when app is available", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);

    const { result } = renderHook(() => useIdAppDetection());

    expect(result.current.isInstalled).toBeNull();
    await waitFor(() => expect(result.current.isInstalled).toBe(true));
  });

  it("should return isInstalled=false when app is not available", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);

    const { result } = renderHook(() => useIdAppDetection());

    await waitFor(() => expect(result.current.isInstalled).toBe(false));
  });

  it("should return isInstalled=false when canOpenURL rejects", async () => {
    jest.spyOn(Linking, "canOpenURL").mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useIdAppDetection());

    await waitFor(() => expect(result.current.isInstalled).toBe(false));
  });

  it("should call Linking.openURL when openIdApp is called", () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
    const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { result } = renderHook(() => useIdAppDetection());
    result.current.openIdApp("concordiumidapp://test");

    expect(spy).toHaveBeenCalledWith("concordiumidapp://test");
  });

  it("should return iOS store URL on iOS", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "ios";

    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const { result } = renderHook(() => useIdAppDetection());

    expect(result.current.storeUrl).toContain("apps.apple.com");

    Platform.OS = originalPlatform;
  });

  it("should return Play Store URL on Android", () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";

    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const { result } = renderHook(() => useIdAppDetection());

    expect(result.current.storeUrl).toContain("play.google.com");

    Platform.OS = originalPlatform;
  });
});
