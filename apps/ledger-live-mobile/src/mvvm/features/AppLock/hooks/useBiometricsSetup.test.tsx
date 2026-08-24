import { act, renderHook } from "@tests/test-renderer";
import { useBiometricsSetup } from "./useBiometricsSetup";

jest.mock("../adapters/biometrics", () => ({
  armBiometricPrompt: jest.fn(),
  disarmBiometricPrompt: jest.fn(async () => undefined),
  promptBiometrics: jest.fn(),
}));

jest.mock("../adapters/installMarker", () => ({
  writeInstallMarker: jest.fn(async () => undefined),
}));

const { armBiometricPrompt, disarmBiometricPrompt, promptBiometrics } =
  jest.requireMock("../adapters/biometrics");
const { writeInstallMarker } = jest.requireMock("../adapters/installMarker");

beforeEach(() => jest.clearAllMocks());

describe("turning biometrics on", () => {
  it("records it only once the user has passed the prompt", async () => {
    armBiometricPrompt.mockResolvedValue(true);
    promptBiometrics.mockResolvedValue({ status: "succeeded" });

    const { store, result } = renderHook(() => useBiometricsSetup());

    await act(async () => {
      await expect(result.current.enable("Confirm it is you")).resolves.toBe(true);
    });

    expect(writeInstallMarker).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.biometricsEnabled).toBe(true);
  });

  it("records nothing when the prompt is refused", async () => {
    armBiometricPrompt.mockResolvedValue(true);
    promptBiometrics.mockResolvedValue({ status: "cancelled" });

    const { store, result } = renderHook(() => useBiometricsSetup());

    await act(async () => {
      await expect(result.current.enable("Confirm it is you")).resolves.toBe(false);
    });

    expect(armBiometricPrompt).not.toHaveBeenCalled();
    expect(writeInstallMarker).not.toHaveBeenCalled();
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
  });

  it("asks the user before touching the keychain, so only one prompt is ever shown", async () => {
    armBiometricPrompt.mockResolvedValue(true);
    promptBiometrics.mockResolvedValue({ status: "succeeded" });

    const { result } = renderHook(() => useBiometricsSetup());

    await act(async () => {
      await result.current.enable("Confirm it is you");
    });

    expect(promptBiometrics.mock.invocationCallOrder[0]).toBeLessThan(
      armBiometricPrompt.mock.invocationCallOrder[0],
    );
  });

  it("stops when the keychain refuses to record it", async () => {
    armBiometricPrompt.mockResolvedValue(false);
    promptBiometrics.mockResolvedValue({ status: "succeeded" });

    const { store, result } = renderHook(() => useBiometricsSetup());

    await act(async () => {
      await expect(result.current.enable("Confirm it is you")).resolves.toBe(false);
    });

    expect(writeInstallMarker).not.toHaveBeenCalled();
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
  });
});

describe("turning biometrics off", () => {
  it("destroys the canary and forgets the protection", async () => {
    const { store, result } = renderHook(() => useBiometricsSetup(), {
      overrideInitialState: state => ({
        ...state,
        appLock: { ...state.appLock, biometricsEnabled: true },
      }),
    });

    await act(async () => {
      await result.current.disable();
    });

    expect(disarmBiometricPrompt).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.biometricsEnabled).toBe(false);
  });
});
