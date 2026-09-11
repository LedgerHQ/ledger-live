import { act, renderHook } from "@testing-library/react";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { useMoreViewModel } from "./useMoreViewModel";

jest.mock("@domain/api-card-management", () => ({ useGetUserQuery: jest.fn() }));
jest.mock("@features/flow-pay-card-auth/hooks", () => ({
  useIsCardSignedIn: jest.fn(),
  useCardLogout: jest.fn(),
}));

import { useGetUserQuery } from "@domain/api-card-management";
import { useCardLogout, useIsCardSignedIn } from "@features/flow-pay-card-auth/hooks";

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

type Setup = {
  isSignedIn?: boolean;
  hasUser?: boolean;
};

function renderWith({ isSignedIn = true, hasUser = true }: Setup = {}) {
  const logout = jest.fn();

  jest.mocked(useCardLogout).mockReturnValue(logout);
  jest.mocked(useIsCardSignedIn).mockReturnValue(isSignedIn);
  jest.mocked(useGetUserQuery).mockReturnValue({
    data: hasUser ? user : undefined,
  } as unknown as ReturnType<typeof useGetUserQuery>);

  const { result, rerender } = renderHook(() => useMoreViewModel(), { wrapper: I18nWrapper });

  const signIn = (signedIn: boolean) =>
    act(() => {
      jest.mocked(useIsCardSignedIn).mockReturnValue(signedIn);
      rerender();
    });

  return { logout, result, signIn };
}

function pressLogout(model: ReturnType<typeof useMoreViewModel>) {
  act(() => model?.rows.find(row => row.id === "logout")?.onPress());
}

describe("useMoreViewModel", () => {
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

  it.each([
    ["nobody is signed in", { isSignedIn: false }],
    ["the signed-in user has not arrived yet", { hasUser: false }],
  ] as const)("shows nothing while %s", (_reason, setup) => {
    expect(renderWith(setup).result.current).toBeNull();
  });

  it("starts with the sheet closed", () => {
    expect(renderWith().result.current?.isSheetOpen).toBe(false);
  });

  it("opens the sheet on request", () => {
    const { result } = renderWith();

    act(() => result.current?.onMorePress());

    expect(result.current?.isSheetOpen).toBe(true);
  });

  it("closes the sheet when it is dismissed", () => {
    const { result } = renderWith();

    act(() => result.current?.onMorePress());
    act(() => result.current?.onSheetClose());

    expect(result.current?.isSheetOpen).toBe(false);
  });

  it("logs out and closes the sheet when the row is pressed", () => {
    const { logout, result } = renderWith();

    act(() => result.current?.onMorePress());
    pressLogout(result.current);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(result.current?.isSheetOpen).toBe(false);
  });

  it("shows nothing once the session ends", () => {
    const { result, signIn } = renderWith();

    signIn(false);

    expect(result.current).toBeNull();
  });

  it("offers the action again after a logout and a new login", () => {
    const { result, signIn } = renderWith();

    signIn(false);
    signIn(true);

    expect(result.current?.moreLabel).toBe("More");
    expect(result.current?.rows).toHaveLength(4);
  });

  it("forgets an open sheet when the session ends", () => {
    const { result, signIn } = renderWith();

    act(() => result.current?.onMorePress());
    signIn(false);
    signIn(true);

    expect(result.current?.isSheetOpen).toBe(false);
  });
});
