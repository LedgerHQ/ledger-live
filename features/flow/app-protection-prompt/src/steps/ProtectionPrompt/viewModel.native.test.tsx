import type { BiometricsAvailability } from "@features/platform-app-lock";
import { track } from "@shared/analytics";
import { act, renderHook } from "@testing-library/react-native";
import { useProtectionPromptViewModel } from "./viewModel";
import type { UseProtectionPromptViewModelOptions } from "./types";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const AVAILABLE: BiometricsAvailability = { status: "available", kind: "FaceID" };

const renderViewModel = (overrides: Partial<UseProtectionPromptViewModelOptions> = {}) => {
  const handlers = {
    onEnableBiometrics: jest.fn(),
    onCreatePassword: jest.fn(),
    onDismiss: jest.fn(),
  };

  const { result } = renderHook(() =>
    useProtectionPromptViewModel({
      isRequested: true,
      isProtected: false,
      biometrics: AVAILABLE,
      ...handlers,
      ...overrides,
    }),
  );

  return { result, ...handlers };
};

describe("asking a user to protect the app", () => {
  it("offers biometrics when the device has some", () => {
    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(true);
    expect(result.current.variant).toBe("biometrics");
    expect(result.current.biometricsKind).toBe("FaceID");
  });

  it("falls back to a password when the device has no biometrics", () => {
    const { result } = renderViewModel({ biometrics: { status: "unavailable" } });

    expect(result.current.variant).toBe("password");
    expect(result.current.biometricsKind).toBeUndefined();
  });

  it("falls back to a password when the hardware is there but nothing is enrolled", () => {
    const { result } = renderViewModel({ biometrics: { status: "notEnrolled" } });

    expect(result.current.variant).toBe("password");
  });

  it("stays shut until the capability is known, which would otherwise show the wrong variant", () => {
    const { result } = renderViewModel({ biometrics: undefined });

    expect(result.current.isOpen).toBe(false);
  });

  it("does not interrupt an already-protected user", () => {
    const { result } = renderViewModel({ isProtected: true });

    expect(result.current.isOpen).toBe(false);
  });

  it("stays shut when no one asked", () => {
    const { result } = renderViewModel({ isRequested: false });

    expect(result.current.isOpen).toBe(false);
  });

  it("enables biometrics from the biometrics variant", () => {
    const { result, onEnableBiometrics, onCreatePassword } = renderViewModel();

    result.current.onConfirm();

    expect(onEnableBiometrics).toHaveBeenCalledTimes(1);
    expect(onCreatePassword).not.toHaveBeenCalled();
  });

  it("opens the password flow from the password variant", () => {
    const { result, onEnableBiometrics, onCreatePassword } = renderViewModel({
      biometrics: { status: "lockedOut" },
    });

    result.current.onConfirm();

    expect(onCreatePassword).toHaveBeenCalledTimes(1);
    expect(onEnableBiometrics).not.toHaveBeenCalled();
  });

  it("reports the enable as in progress until the system prompt settles", async () => {
    let finish: () => void = () => undefined;
    const onEnableBiometrics = jest.fn(
      () =>
        new Promise<void>(resolve => {
          finish = resolve;
        }),
    );
    const { result } = renderViewModel({ onEnableBiometrics });

    expect(result.current.isConfirming).toBe(false);

    act(() => {
      result.current.onConfirm();
    });

    expect(result.current.isConfirming).toBe(true);

    await act(async () => {
      finish();
    });

    expect(result.current.isConfirming).toBe(false);
  });

  it("opens a single system prompt however many times it is pressed meanwhile", async () => {
    const onEnableBiometrics = jest.fn(() => new Promise<void>(() => undefined));
    const { result } = renderViewModel({ onEnableBiometrics });

    act(() => {
      result.current.onConfirm();
      result.current.onConfirm();
    });

    act(() => {
      result.current.onConfirm();
    });

    expect(onEnableBiometrics).toHaveBeenCalledTimes(1);
  });

  it("reports the password enable press", () => {
    const { result } = renderViewModel({ biometrics: { status: "unavailable" } });

    act(() => {
      result.current.onConfirm();
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", { button: "enable", type: "password" });
  });

  it("reports the biometrics enable press once however many times it is pressed meanwhile", () => {
    const onEnableBiometrics = jest.fn(() => new Promise<void>(() => undefined));
    const { result } = renderViewModel({ onEnableBiometrics });

    act(() => {
      result.current.onConfirm();
      result.current.onConfirm();
    });

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", { button: "enable", type: "biometrics" });
  });

  it("reports nothing when the prompt is closed", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.onClose();
    });

    expect(track).not.toHaveBeenCalled();
  });
});
