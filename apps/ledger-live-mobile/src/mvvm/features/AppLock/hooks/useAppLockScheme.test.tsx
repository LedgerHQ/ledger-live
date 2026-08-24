import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useAppLockScheme } from "./useAppLockScheme";

jest.mock("../adapters/verifierStore", () => ({
  hasPasswordVerifier: jest.fn(),
}));

const { hasPasswordVerifier } = jest.requireMock("../adapters/verifierStore");

const withRevamp = (enabled: boolean) => withFlagOverrides({ lwmPasswordRevamp: { enabled } });

beforeEach(() => jest.clearAllMocks());

describe("which lock a device gets", () => {
  it("answers nothing until the keychain has been read", () => {
    hasPasswordVerifier.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAppLockScheme(), {
      overrideInitialState: withRevamp(true),
    });

    expect(result.current).toBeUndefined();
  });

  it("keeps a migrated device on the new path even with the flag off", async () => {
    hasPasswordVerifier.mockResolvedValue(true);

    const { result } = renderHook(() => useAppLockScheme(), {
      overrideInitialState: withRevamp(false),
    });

    await waitFor(() => expect(result.current).toBe("revamped"));
  });

  it("leaves a device the flag has not reached on the legacy path", async () => {
    hasPasswordVerifier.mockResolvedValue(false);

    const { result } = renderHook(() => useAppLockScheme(), {
      overrideInitialState: withRevamp(false),
    });

    await waitFor(() => expect(result.current).toBe("legacy"));
  });

  it("takes the new path when the keychain cannot be read, since only it can re-derive", async () => {
    hasPasswordVerifier.mockRejectedValue(new Error("keychain unavailable"));

    const { result } = renderHook(() => useAppLockScheme(), {
      overrideInitialState: withRevamp(false),
    });

    await waitFor(() => expect(result.current).toBe("revamped"));
  });
});
