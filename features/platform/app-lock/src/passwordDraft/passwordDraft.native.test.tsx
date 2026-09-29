import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import { PasswordDraftProvider, usePasswordDraft } from "./passwordDraft";

function wrapper({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <PasswordDraftProvider>{children}</PasswordDraftProvider>;
}

describe("usePasswordDraft", () => {
  it("throws without a provider, so the password cannot silently fall back to nav state", () => {
    expect(() => renderHook(() => usePasswordDraft())).toThrow(/PasswordDraftProvider/);
  });

  it("holds what was written until it is cleared", () => {
    const { result } = renderHook(() => usePasswordDraft(), { wrapper });

    expect(result.current.read()).toBeNull();

    act(() => result.current.write("secret1"));
    expect(result.current.read()).toBe("secret1");

    act(() => result.current.clear());
    expect(result.current.read()).toBeNull();
  });
});
