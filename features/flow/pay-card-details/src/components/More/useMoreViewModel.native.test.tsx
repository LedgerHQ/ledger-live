import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useMoreViewModel } from "./useMoreViewModel";
import { MORE_RESOURCES } from "./fixtures";

jest.mock("@domain/api-card-management", () => ({ useGetUserQuery: jest.fn() }));
jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: jest.fn(),
  useCardLogout: jest.fn(),
}));

import { useGetUserQuery } from "@domain/api-card-management";
import { useCardLogout, useIsCardSignedIn } from "@features/flow-pay-card-auth";

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

type Setup = {
  isSignedIn?: boolean;
  hasUser?: boolean;
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <I18nTestProvider resources={MORE_RESOURCES}>{children}</I18nTestProvider>;
}

function renderWith({ isSignedIn = true, hasUser = true }: Setup = {}) {
  const logout = jest.fn();

  jest.mocked(useCardLogout).mockReturnValue(logout);
  jest.mocked(useIsCardSignedIn).mockReturnValue(isSignedIn);
  jest.mocked(useGetUserQuery).mockReturnValue({
    data: hasUser ? user : undefined,
  } as unknown as ReturnType<typeof useGetUserQuery>);

  const { result, rerender } = renderHook(() => useMoreViewModel(), { wrapper });

  const signIn = (signedIn: boolean) =>
    act(() => {
      jest.mocked(useIsCardSignedIn).mockReturnValue(signedIn);
      rerender(undefined);
    });

  return { logout, result, signIn };
}

describe("useMoreViewModel (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("offers the action as soon as the card holder is signed in", () => {
    const { result } = renderWith();

    expect(result.current?.moreLabel).toBe("More");
    expect(result.current?.rows.map(row => row.id)).toEqual([
      "managePin",
      "accessBaanx",
      "help",
      "logout",
    ]);
  });

  it("shows nothing while nobody is signed in", () => {
    expect(renderWith({ isSignedIn: false }).result.current).toBeNull();
  });

  it("opens the sheet on request and logs out from the row", () => {
    const { logout, result } = renderWith();

    act(() => result.current?.onMorePress());
    expect(result.current?.isSheetOpen).toBe(true);

    act(() => result.current?.rows.find(row => row.id === "logout")?.onPress());

    expect(logout).toHaveBeenCalledTimes(1);
    expect(result.current?.isSheetOpen).toBe(false);
  });

  it("forgets an open sheet when the session ends", () => {
    const { result, signIn } = renderWith();

    act(() => result.current?.onMorePress());
    signIn(false);
    signIn(true);

    expect(result.current?.isSheetOpen).toBe(false);
  });
});
