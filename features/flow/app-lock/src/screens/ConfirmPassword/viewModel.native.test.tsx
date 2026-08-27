import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { PasswordDraftProvider, usePasswordDraft } from "../../state/passwordDraft";
import { useConfirmPasswordViewModel } from "./viewModel";

function wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PasswordDraftProvider>{children}</PasswordDraftProvider>;
}

function renderViewModel(chosen: string | null, onConfirmed = jest.fn()) {
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

  return { ...rendered, onConfirmed };
}

describe("useConfirmPasswordViewModel", () => {
  it("enables Confirm as soon as the field is non-empty", () => {
    const { result } = renderViewModel("123456");

    expect(result.current.viewModel.isConfirmEnabled).toBe(false);

    act(() => result.current.viewModel.onPasswordChange("1"));
    expect(result.current.viewModel.isConfirmEnabled).toBe(true);
  });

  it("confirms a matching password", () => {
    const { result, onConfirmed } = renderViewModel("123456");

    act(() => result.current.viewModel.onPasswordChange("123456"));
    act(() => result.current.viewModel.onConfirm());

    expect(onConfirmed).toHaveBeenCalledWith("123456");
    expect(result.current.viewModel.hasMismatch).toBe(false);
  });

  it("surfaces a mismatch and does not confirm", () => {
    const { result, onConfirmed } = renderViewModel("123456");

    act(() => result.current.viewModel.onPasswordChange("123457"));
    act(() => result.current.viewModel.onConfirm());

    expect(onConfirmed).not.toHaveBeenCalled();
    expect(result.current.viewModel.hasMismatch).toBe(true);
  });

  it("clears the mismatch as soon as the user types again", () => {
    const { result } = renderViewModel("123456");

    act(() => result.current.viewModel.onPasswordChange("123457"));
    act(() => result.current.viewModel.onConfirm());
    expect(result.current.viewModel.hasMismatch).toBe(true);

    act(() => result.current.viewModel.onPasswordChange("12345"));
    expect(result.current.viewModel.hasMismatch).toBe(false);
  });

  it("treats whitespace as significant", () => {
    const { result, onConfirmed } = renderViewModel("  ab  ");

    act(() => result.current.viewModel.onPasswordChange("  ab"));
    act(() => result.current.viewModel.onConfirm());
    expect(onConfirmed).not.toHaveBeenCalled();

    act(() => result.current.viewModel.onPasswordChange("  ab  "));
    act(() => result.current.viewModel.onConfirm());
    expect(onConfirmed).toHaveBeenCalledWith("  ab  ");
  });

  it("cannot confirm when no password was chosen", () => {
    const { result, onConfirmed } = renderViewModel(null);

    act(() => result.current.viewModel.onPasswordChange("123456"));
    act(() => result.current.viewModel.onConfirm());

    expect(onConfirmed).not.toHaveBeenCalled();
    expect(result.current.viewModel.hasMismatch).toBe(true);
  });
});
