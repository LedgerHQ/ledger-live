import { act, renderHook } from "@testing-library/react-native";
import type { DeactivatePasswordOutcome } from "./types";
import { useDeactivatePasswordViewModel } from "./viewModel";

function renderViewModel(onDeactivate: (password: string) => Promise<DeactivatePasswordOutcome>) {
  const rendered = renderHook(() => useDeactivatePasswordViewModel({ onDeactivate }));

  const type = async (value: string) => {
    await act(async () => rendered.result.current.onPasswordChange(value));
  };
  const confirm = async () => {
    await act(async () => {
      await rendered.result.current.onConfirm();
    });
  };

  return { ...rendered, type, confirm };
}

describe("useDeactivatePasswordViewModel", () => {
  it("enables Confirm on any non-empty entry, with no minimum length", async () => {
    const { result, type } = renderViewModel(async () => "deactivated" as const);

    expect(result.current.isConfirmEnabled).toBe(false);

    await type("a");
    expect(result.current.isConfirmEnabled).toBe(true);
  });

  it("passes the password through and leaves navigation to the caller on success", async () => {
    const onDeactivate = jest.fn(async (): Promise<DeactivatePasswordOutcome> => "deactivated");
    const { result, type, confirm } = renderViewModel(onDeactivate);

    await type("123456");
    await confirm();

    expect(onDeactivate).toHaveBeenCalledWith("123456");
    expect(result.current.hasWrongPassword).toBe(false);
  });

  it("reports a wrong password and clears the field", async () => {
    const { result, type, confirm } = renderViewModel(async () => "wrongPassword" as const);

    await type("wrong1");
    await confirm();

    expect(result.current.hasWrongPassword).toBe(true);
    expect(result.current.password).toBe("");
    expect(result.current.isConfirmEnabled).toBe(false);
  });

  it("clears the wrong-password state as soon as the user types again", async () => {
    const { result, type, confirm } = renderViewModel(async () => "wrongPassword" as const);

    await type("wrong1");
    await confirm();
    expect(result.current.hasWrongPassword).toBe(true);

    await type("a");
    expect(result.current.hasWrongPassword).toBe(false);
  });

  it("does nothing on an empty submit", async () => {
    const onDeactivate = jest.fn(async (): Promise<DeactivatePasswordOutcome> => "deactivated");
    const { confirm } = renderViewModel(onDeactivate);

    await confirm();

    expect(onDeactivate).not.toHaveBeenCalled();
  });

  it("stops submitting when deactivation throws", async () => {
    const { result, type } = renderViewModel(() => Promise.reject(new Error("keychain down")));

    await type("123456");
    await act(async () => {
      await expect(result.current.onConfirm()).rejects.toThrow("keychain down");
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isConfirmEnabled).toBe(true);
  });
});
