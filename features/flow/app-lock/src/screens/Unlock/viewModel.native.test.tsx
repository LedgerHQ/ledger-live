import { act, renderHook } from "@testing-library/react-native";
import type { UnlockOutcome, UseUnlockViewModelOptions } from "./types";
import { useUnlockViewModel } from "./viewModel";

function renderViewModel(overrides: Partial<UseUnlockViewModelOptions> = {}) {
  const options: UseUnlockViewModelOptions = {
    onVerify: async () => "unlocked",
    canRetryBiometrics: false,
    onRetryBiometrics: jest.fn(),
    onForgotPassword: jest.fn(),
    ...overrides,
  };

  const rendered = renderHook(() => useUnlockViewModel(options));

  const type = async (value: string) => {
    await act(async () => rendered.result.current.onPasswordChange(value));
  };
  const unlock = async () => {
    await act(async () => {
      await rendered.result.current.onUnlock();
    });
  };

  return { ...rendered, options, type, unlock };
}

describe("useUnlockViewModel", () => {
  it("enables unlock on any non-empty entry, with no minimum length", async () => {
    const { result, type } = renderViewModel();

    expect(result.current.isUnlockEnabled).toBe(false);

    await type("1");
    expect(result.current.isUnlockEnabled).toBe(true);
  });

  it("verifies and leaves navigation to the caller", async () => {
    const onVerify = jest.fn(async (): Promise<UnlockOutcome> => "unlocked");
    const { result, type, unlock } = renderViewModel({ onVerify });

    await type("123456");
    await unlock();

    expect(onVerify).toHaveBeenCalledWith("123456");
    expect(result.current.hasWrongPassword).toBe(false);
  });

  it("reports a wrong password and clears the field", async () => {
    const { result, type, unlock } = renderViewModel({ onVerify: async () => "incorrect" });

    await type("wrong1");
    await unlock();

    expect(result.current.hasWrongPassword).toBe(true);
    expect(result.current.password).toBe("");
  });

  it("does not claim a wrong password when verification fails outright", async () => {
    const { result, type, unlock } = renderViewModel({ onVerify: async () => "failed" });

    await type("123456");
    await unlock();

    expect(result.current.hasWrongPassword).toBe(false);
  });

  it("clears the error as soon as the user types again", async () => {
    const { result, type, unlock } = renderViewModel({ onVerify: async () => "incorrect" });

    await type("wrong1");
    await unlock();
    expect(result.current.hasWrongPassword).toBe(true);

    await type("a");
    expect(result.current.hasWrongPassword).toBe(false);
  });

  it("blocks a second submit while verifying", async () => {
    let release = () => {};
    const onVerify = jest.fn(
      () =>
        new Promise<UnlockOutcome>(resolve => {
          release = () => resolve("unlocked");
        }),
    );
    const { result, type } = renderViewModel({ onVerify });

    await type("123456");

    let unlocking: Promise<void> | undefined;
    await act(async () => {
      unlocking = Promise.resolve(result.current.onUnlock());
    });

    expect(result.current.isVerifying).toBe(true);
    expect(result.current.isUnlockEnabled).toBe(false);

    await act(async () => {
      release();
      await unlocking;
    });

    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it("does nothing on an empty submit", async () => {
    const onVerify = jest.fn(async (): Promise<UnlockOutcome> => "unlocked");
    const { unlock } = renderViewModel({ onVerify });

    await unlock();

    expect(onVerify).not.toHaveBeenCalled();
  });

  it("only offers the biometric retry when biometrics is enabled", () => {
    expect(renderViewModel({ canRetryBiometrics: false }).result.current.canRetryBiometrics).toBe(
      false,
    );
    expect(renderViewModel({ canRetryBiometrics: true }).result.current.canRetryBiometrics).toBe(
      true,
    );
  });
});
