import { renderHook, waitFor } from "@tests/test-renderer";
import { useAppLockBootstrap } from "./useAppLockBootstrap";

jest.mock("../adapters/verifierStore", () => ({
  readStoredPassword: jest.fn(),
  hasPasswordVerifier: jest.fn(),
  clearPasswordVerifier: jest.fn(async () => undefined),
}));

jest.mock("../adapters/biometrics", () => ({
  hasArmedBiometricPrompt: jest.fn(),
  disarmBiometricPrompt: jest.fn(async () => undefined),
}));

jest.mock("../adapters/installMarker", () => ({
  hasInstallMarker: jest.fn(),
}));

const { readStoredPassword, hasPasswordVerifier, clearPasswordVerifier } = jest.requireMock(
  "../adapters/verifierStore",
);
const { hasArmedBiometricPrompt, disarmBiometricPrompt } =
  jest.requireMock("../adapters/biometrics");
const { hasInstallMarker } = jest.requireMock("../adapters/installMarker");

const storedPassword = { verifier: { version: 1 }, needsLongerPassword: false };

const setUp = ({
  stored = null,
  verifier = false,
  biometrics = false,
  marker = false,
}: Readonly<{
  stored?: unknown;
  verifier?: boolean;
  biometrics?: boolean;
  marker?: boolean;
}> = {}) => {
  readStoredPassword.mockResolvedValue(stored);
  hasPasswordVerifier.mockResolvedValue(verifier);
  hasArmedBiometricPrompt.mockResolvedValue(biometrics);
  hasInstallMarker.mockResolvedValue(marker);

  const { store, result } = renderHook(() => useAppLockBootstrap());

  return { store, result };
};

beforeEach(() => jest.clearAllMocks());

describe("app lock bootstrap", () => {
  it("hydrates both protections from the keychain, which the store does not persist", async () => {
    const { store, result } = setUp({
      stored: { ...storedPassword, needsLongerPassword: true },
      verifier: true,
      biometrics: true,
      marker: true,
    });

    await waitFor(() => expect(result.current).toBe(true));

    expect(store.getState().appLock).toMatchObject({
      hasPassword: true,
      biometricsEnabled: true,
      needsLongerPassword: true,
    });
  });

  it("leaves an unprotected app unprotected", async () => {
    const { store, result } = setUp({ marker: true });

    await waitFor(() => expect(result.current).toBe(true));

    expect(store.getState().appLock).toMatchObject({
      hasPassword: false,
      biometricsEnabled: false,
    });
  });

  it("keeps locking when a stored verifier will not parse", async () => {
    const { store, result } = setUp({ stored: null, verifier: true, marker: true });

    await waitFor(() => expect(result.current).toBe(true));

    expect(store.getState().appLock.hasPassword).toBe(true);
  });

  it("drops protection that outlived its install", async () => {
    const { store, result } = setUp({
      stored: storedPassword,
      verifier: true,
      biometrics: true,
      marker: false,
    });

    await waitFor(() => expect(result.current).toBe(true));

    expect(clearPasswordVerifier).toHaveBeenCalledTimes(1);
    expect(disarmBiometricPrompt).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock).toMatchObject({
      hasPassword: false,
      biometricsEnabled: false,
    });
  });

  it("refuses entry rather than opening the app when the keychain cannot be read", async () => {
    readStoredPassword.mockRejectedValue(new Error("keychain unavailable"));
    hasPasswordVerifier.mockResolvedValue(false);
    hasArmedBiometricPrompt.mockResolvedValue(false);
    hasInstallMarker.mockResolvedValue(true);

    const { store, result } = renderHook(() => useAppLockBootstrap());

    await waitFor(() => expect(result.current).toBe(true));

    expect(store.getState().appLock.hasPassword).toBe(true);
    expect(clearPasswordVerifier).not.toHaveBeenCalled();
  });
});
