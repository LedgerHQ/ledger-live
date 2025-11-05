import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { renderHook, waitFor } from "@tests/test-renderer";
import { useFirebaseRemoteConfig } from "../useFirebaseRemoteConfig";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const { setDefaults, setConfigSettings, fetchAndActivate } = getRemoteConfig() as jest.Mocked<
  ReturnType<typeof getRemoteConfig>
>;

describe("useFirebaseRemoteConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setConfigSettings.mockResolvedValue();
    setDefaults.mockResolvedValue(null);
    fetchAndActivate.mockResolvedValue(true);
  });

  it("returns true once setConfigSettings, setDefaults, and fetchAndActivate are resolved", async () => {
    const { result } = renderHook(() => useFirebaseRemoteConfig());
    await waitFor(() => expect(result.current).toBe(true));
    expect(setConfigSettings).toHaveBeenCalledWith({ minimumFetchIntervalMillis: 0 });
    expect(setDefaults).toHaveBeenCalled();
    expect(fetchAndActivate).toHaveBeenCalled();
  });

  it("still returns true if one of the firebase initialization calls fail", async () => {
    setConfigSettings.mockRejectedValue(new Error("Request failed"));
    const { result } = renderHook(() => useFirebaseRemoteConfig());
    await waitFor(() => expect(result.current).toBe(true));
    expect(setConfigSettings).toHaveBeenCalledWith({ minimumFetchIntervalMillis: 0 });
    expect(setDefaults).toHaveBeenCalled();
    expect(fetchAndActivate).not.toHaveBeenCalled();
  });

  it("still returns true if fetchAndActivate fails", async () => {
    fetchAndActivate.mockRejectedValue(new Error("Request failed"));
    const { result } = renderHook(() => useFirebaseRemoteConfig());
    await waitFor(() => expect(result.current).toBe(true));
    expect(setConfigSettings).toHaveBeenCalledWith({ minimumFetchIntervalMillis: 0 });
    expect(setDefaults).toHaveBeenCalled();
    expect(fetchAndActivate).toHaveBeenCalled();
  });
});
