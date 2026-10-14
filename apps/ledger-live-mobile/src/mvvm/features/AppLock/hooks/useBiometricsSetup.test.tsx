import { track } from "@shared/analytics";
import { act, renderHook } from "@tests/test-renderer";
import { useBiometricsSetup } from "./useBiometricsSetup";

// Mocked at the package boundary, not at the native one: under pnpm the package resolves
// `react-native-biometrics` from its own node_modules, which jest treats as a different module. The
// adapter itself is covered by `biometrics.native.test.ts`; what this file owns is the order.
jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  promptBiometrics: jest.fn(),
  storeBiometricsMarker: jest.fn(),
  clearBiometricsMarker: jest.fn(),
}));

const { promptBiometrics, storeBiometricsMarker, clearBiometricsMarker } = jest.requireMock(
  "@features/platform-app-lock",
);

const marker = { stored: false };

const renderSetup = () => renderHook(() => useBiometricsSetup());

beforeEach(() => {
  jest.clearAllMocks();
  marker.stored = false;

  promptBiometrics.mockResolvedValue({ status: "succeeded" });
  storeBiometricsMarker.mockImplementation(async () => {
    marker.stored = true;
    return true;
  });
  clearBiometricsMarker.mockImplementation(async () => {
    marker.stored = false;
    return true;
  });
});

describe("setting biometrics up", () => {
  it("records it once the owner has passed the prompt", async () => {
    const { store, result } = renderSetup();

    await act(async () => {
      await expect(
        result.current.enable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(true);
    });

    expect(marker.stored).toBe(true);
    expect(store.getState().appLock.biometricsEnabled).toBe(true);
    expect(track).toHaveBeenCalledWith("encryption_updated", {
      status: "activated",
      type: "biometrics",
      source: "settings",
    });
  });

  it("proves before it records, so a refusal leaves nothing behind", async () => {
    promptBiometrics.mockResolvedValue({ status: "failed" });

    const { store, result } = renderSetup();

    await act(async () => {
      await expect(
        result.current.enable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(false);
    });

    expect(storeBiometricsMarker).not.toHaveBeenCalled();
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });

  it("records nothing when the keychain refuses to store the marker", async () => {
    storeBiometricsMarker.mockResolvedValue(false);

    const { store, result } = renderSetup();

    await act(async () => {
      await expect(
        result.current.enable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(false);
    });

    expect(store.getState().appLock.biometricsEnabled).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });

  it("refuses rather than throwing when the keychain fails", async () => {
    storeBiometricsMarker.mockRejectedValue(new Error("keychain unavailable"));

    const { store, result } = renderSetup();

    await act(async () => {
      await expect(
        result.current.enable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(false);
    });

    expect(store.getState().appLock.biometricsEnabled).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });

  it("removes the marker once the owner has passed the prompt", async () => {
    const { store, result } = renderSetup();

    await act(async () => {
      await result.current.enable(
        { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
        "settings",
      );
    });
    await act(async () => {
      await expect(
        result.current.disable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(true);
    });

    expect(marker.stored).toBe(false);
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
    expect(track).toHaveBeenCalledWith("encryption_updated", {
      status: "deactivated",
      type: "biometrics",
      source: "settings",
    });
  });

  it("reports a removal the keychain did not carry out", async () => {
    clearBiometricsMarker.mockResolvedValue(false);

    const { store, result } = renderSetup();

    await act(async () => {
      await result.current.enable(
        { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
        "settings",
      );
    });
    await act(async () => {
      await expect(
        result.current.disable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(false);
    });

    expect(store.getState().appLock.biometricsEnabled).toBe(true);
    expect(track).not.toHaveBeenCalledWith(
      "encryption_updated",
      expect.objectContaining({ status: "deactivated" }),
    );
  });

  it("keeps the protection when the owner cannot pass the prompt to remove it", async () => {
    const { store, result } = renderSetup();

    await act(async () => {
      await result.current.enable(
        { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
        "settings",
      );
    });

    promptBiometrics.mockResolvedValue({ status: "failed" });

    await act(async () => {
      await expect(
        result.current.disable(
          { reason: "Confirm", fallback: "Use PIN", cancel: "Cancel" },
          "settings",
        ),
      ).resolves.toBe(false);
    });

    expect(marker.stored).toBe(true);
    expect(clearBiometricsMarker).not.toHaveBeenCalled();
    expect(store.getState().appLock.biometricsEnabled).toBe(true);
    expect(track).not.toHaveBeenCalledWith(
      "encryption_updated",
      expect.objectContaining({ status: "deactivated" }),
    );
  });
});
