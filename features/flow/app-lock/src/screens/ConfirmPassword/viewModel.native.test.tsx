import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { PasswordDraftProvider, usePasswordDraft } from "../../state/passwordDraft";
import { useConfirmPasswordViewModel } from "./viewModel";

function wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PasswordDraftProvider>{children}</PasswordDraftProvider>;
}

function renderViewModel(
  chosen: string | null,
  onConfirmed: (password: string) => void | Promise<void> = jest.fn(),
) {
  const rendered = renderHook(
    () => ({
      viewModel: useConfirmPasswordViewModel({ onConfirmed }),
      draft: usePasswordDraft(),
    }),
    { wrapper },
  );

  if (chosen !== null) {
    act(() => rendered.result.current.draft.write(chosen));
  }

  const type = async (value: string) => {
    await act(async () => rendered.result.current.viewModel.onPasswordChange(value));
  };
  const confirm = async () => {
    await act(async () => {
      await rendered.result.current.viewModel.onConfirm();
    });
  };

  return { ...rendered, onConfirmed, type, confirm };
}

describe("useConfirmPasswordViewModel", () => {
  it("enables Confirm as soon as the field is non-empty", async () => {
    const { result, type } = renderViewModel("123456");

    expect(result.current.viewModel.isConfirmEnabled).toBe(false);

    await type("1");
    expect(result.current.viewModel.isConfirmEnabled).toBe(true);
  });

  it("confirms a matching password", async () => {
    const onConfirmed = jest.fn();
    const { result, type, confirm } = renderViewModel("123456", onConfirmed);

    await type("123456");
    await confirm();

    expect(onConfirmed).toHaveBeenCalledWith("123456");
    expect(result.current.viewModel.hasMismatch).toBe(false);
    expect(result.current.viewModel.isSaving).toBe(false);
  });

  it("surfaces a mismatch and does not confirm", async () => {
    const onConfirmed = jest.fn();
    const { result, type, confirm } = renderViewModel("123456", onConfirmed);

    await type("123457");
    await confirm();

    expect(onConfirmed).not.toHaveBeenCalled();
    expect(result.current.viewModel.hasMismatch).toBe(true);
  });

  it("clears the mismatch as soon as the user types again", async () => {
    const { result, type, confirm } = renderViewModel("123456");

    await type("123457");
    await confirm();
    expect(result.current.viewModel.hasMismatch).toBe(true);

    await type("12345");
    expect(result.current.viewModel.hasMismatch).toBe(false);
  });

  it("treats whitespace as significant", async () => {
    const onConfirmed = jest.fn();
    const { type, confirm } = renderViewModel("  ab  ", onConfirmed);

    await type("  ab");
    await confirm();
    expect(onConfirmed).not.toHaveBeenCalled();

    await type("  ab  ");
    await confirm();
    expect(onConfirmed).toHaveBeenCalledWith("  ab  ");
  });

  it("cannot confirm when no password was chosen", async () => {
    const onConfirmed = jest.fn();
    const { result, type, confirm } = renderViewModel(null, onConfirmed);

    await type("123456");
    await confirm();

    expect(onConfirmed).not.toHaveBeenCalled();
    expect(result.current.viewModel.hasMismatch).toBe(true);
  });

  it("locks the CTA while saving, so a slow derivation cannot be submitted twice", async () => {
    let release = () => {};
    const onConfirmed = jest.fn(
      () =>
        new Promise<void>(resolve => {
          release = resolve;
        }),
    );
    const { result, type } = renderViewModel("123456", onConfirmed);

    await type("123456");

    let confirming: Promise<void> | undefined;
    await act(async () => {
      confirming = Promise.resolve(result.current.viewModel.onConfirm());
    });

    expect(result.current.viewModel.isSaving).toBe(true);
    expect(result.current.viewModel.isConfirmEnabled).toBe(false);

    await act(async () => {
      release();
      await confirming;
    });

    expect(result.current.viewModel.isSaving).toBe(false);
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it("stops saving and stays on the step when persisting fails", async () => {
    const onConfirmed = jest.fn(() => Promise.reject(new Error("keychain unavailable")));
    const { result, type } = renderViewModel("123456", onConfirmed);

    await type("123456");

    await act(async () => {
      await expect(result.current.viewModel.onConfirm()).rejects.toThrow("keychain unavailable");
    });

    expect(result.current.viewModel.isSaving).toBe(false);
    expect(result.current.viewModel.isConfirmEnabled).toBe(true);
  });
});
