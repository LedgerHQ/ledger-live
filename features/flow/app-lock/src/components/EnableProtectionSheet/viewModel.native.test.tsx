import type { BiometricsAvailability } from "@features/platform-app-lock";
import { act, renderHook } from "@testing-library/react-native";
import type { UseEnableProtectionSheetViewModelOptions } from "./types";
import { useEnableProtectionSheetViewModel } from "./viewModel";

const available: BiometricsAvailability = { status: "available", kind: "FaceID" };

function renderViewModel(overrides: Partial<UseEnableProtectionSheetViewModelOptions> = {}) {
  const options: UseEnableProtectionSheetViewModelOptions = {
    isRequested: true,
    isProtected: false,
    biometrics: available,
    onEnableBiometrics: jest.fn(),
    onCreatePassword: jest.fn(),
    onProceed: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };

  return { ...renderHook(() => useEnableProtectionSheetViewModel(options)), options };
}

describe("useEnableProtectionSheetViewModel", () => {
  it("offers biometrics when the device has it", () => {
    expect(renderViewModel().result.current.variant).toBe("biometrics");
  });

  it.each([{ status: "unavailable" }, { status: "notEnrolled" }, { status: "lockedOut" }] as const)(
    "falls back to a password when biometrics is %o",
    biometrics => {
      expect(renderViewModel({ biometrics }).result.current.variant).toBe("password");
    },
  );

  it("does not open for an already-protected user, and lets their action run", () => {
    const { result, options } = renderViewModel({ isProtected: true });

    expect(result.current.isOpen).toBe(false);
    expect(options.onProceed).toHaveBeenCalledTimes(1);
  });

  it("stays shut until the caller asks", () => {
    const { result, options } = renderViewModel({ isRequested: false });

    expect(result.current.isOpen).toBe(false);
    expect(options.onProceed).not.toHaveBeenCalled();
  });

  it("opens for an unprotected user who was asked", () => {
    expect(renderViewModel().result.current.isOpen).toBe(true);
  });

  it("routes confirm to the offered protection, never both", () => {
    const biometricsRun = renderViewModel();
    act(() => biometricsRun.result.current.onConfirm());
    expect(biometricsRun.options.onEnableBiometrics).toHaveBeenCalledTimes(1);
    expect(biometricsRun.options.onCreatePassword).not.toHaveBeenCalled();

    const passwordRun = renderViewModel({ biometrics: { status: "notEnrolled" } });
    act(() => passwordRun.result.current.onConfirm());
    expect(passwordRun.options.onCreatePassword).toHaveBeenCalledTimes(1);
    expect(passwordRun.options.onEnableBiometrics).not.toHaveBeenCalled();
  });

  it("dismissing does not let the caller's action run", () => {
    const { result, options } = renderViewModel();

    act(() => result.current.onClose());

    expect(options.onDismiss).toHaveBeenCalledTimes(1);
    expect(options.onProceed).not.toHaveBeenCalled();
  });
});
