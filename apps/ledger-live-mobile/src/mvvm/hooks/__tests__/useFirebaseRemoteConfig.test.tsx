let resolveReady: (() => void) | null = null;
let rejectReady: ((error: Error) => void) | null = null;
let readyPromise: Promise<void>;

const resetReady = () => {
  readyPromise = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
};
resetReady();

jest.mock("~/firebase/remoteConfig", () => ({
  whenReady: () => readyPromise,
}));

const setProviderMock = jest.fn();
jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    setProvider: (...args: unknown[]) => setProviderMock(...args),
  },
}));

jest.mock("@ledgerhq/live-config/providers/index", () => ({
  FirebaseRemoteConfigProvider: jest.fn().mockImplementation(args => args),
}));

import { renderHook, waitFor } from "@tests/test-renderer";
import { useFirebaseRemoteConfig } from "../useFirebaseRemoteConfig";

describe("useFirebaseRemoteConfig", () => {
  beforeEach(() => {
    setProviderMock.mockClear();
    resetReady();
  });

  it("installs the LiveConfig provider on mount", async () => {
    renderHook(() => useFirebaseRemoteConfig());
    expect(setProviderMock).toHaveBeenCalledTimes(1);
  });

  it("returns true once whenReady resolves", async () => {
    const { result } = renderHook(() => useFirebaseRemoteConfig());
    expect(result.current).toBe(false);

    resolveReady?.();

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns true even when whenReady rejects so the app boot is not blocked", async () => {
    const { result } = renderHook(() => useFirebaseRemoteConfig());
    expect(result.current).toBe(false);

    rejectReady?.(new Error("whenReady failed"));

    await waitFor(() => expect(result.current).toBe(true));
  });
});
