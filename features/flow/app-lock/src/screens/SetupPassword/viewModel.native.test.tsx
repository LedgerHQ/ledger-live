import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { PasswordDraftProvider, usePasswordDraft } from "../../state/passwordDraft";
import { useSetupPasswordViewModel } from "./viewModel";

function wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PasswordDraftProvider>{children}</PasswordDraftProvider>;
}

function renderViewModel(onValid = jest.fn()) {
  const rendered = renderHook(
    () => ({
      viewModel: useSetupPasswordViewModel({ onValid }),
      draft: usePasswordDraft(),
    }),
    { wrapper },
  );

  return { ...rendered, onValid };
}

describe("useSetupPasswordViewModel", () => {
  it("keeps Continue disabled under six characters", () => {
    const { result } = renderViewModel();

    expect(result.current.viewModel.isContinueEnabled).toBe(false);

    act(() => result.current.viewModel.onPasswordChange("12345"));
    expect(result.current.viewModel.isContinueEnabled).toBe(false);

    act(() => result.current.viewModel.onPasswordChange("123456"));
    expect(result.current.viewModel.isContinueEnabled).toBe(true);
  });

  it("accepts six symbols", () => {
    const { result } = renderViewModel();

    act(() => result.current.viewModel.onPasswordChange("!@#$%^"));

    expect(result.current.viewModel.isContinueEnabled).toBe(true);
  });

  it("preserves leading and trailing spaces", () => {
    const { result } = renderViewModel();

    act(() => result.current.viewModel.onPasswordChange("  ab  "));

    expect(result.current.viewModel.password).toBe("  ab  ");
    expect(result.current.viewModel.isContinueEnabled).toBe(true);

    act(() => result.current.viewModel.onContinue());
    expect(result.current.draft.read()).toBe("  ab  ");
  });

  it("writes the draft and advances only when valid", () => {
    const { result, onValid } = renderViewModel();

    act(() => result.current.viewModel.onPasswordChange("12345"));
    act(() => result.current.viewModel.onContinue());

    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.draft.read()).toBeNull();

    act(() => result.current.viewModel.onPasswordChange("123456"));
    act(() => result.current.viewModel.onContinue());

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(result.current.draft.read()).toBe("123456");
  });
});

describe("usePasswordDraft", () => {
  it("throws without a provider, so the password cannot silently fall back to nav state", () => {
    expect(() => renderHook(() => usePasswordDraft())).toThrow(/PasswordDraftProvider/);
  });

  it("clears on demand", () => {
    const { result } = renderHook(() => usePasswordDraft(), { wrapper });

    act(() => result.current.write("secret1"));
    expect(result.current.read()).toBe("secret1");

    act(() => result.current.clear());
    expect(result.current.read()).toBeNull();
  });
});
