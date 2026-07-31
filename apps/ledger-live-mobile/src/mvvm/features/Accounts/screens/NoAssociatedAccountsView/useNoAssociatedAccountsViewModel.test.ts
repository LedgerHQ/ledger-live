import React from "react";
import { renderHook } from "@tests/test-renderer";
import useNoAssociatedAccountsViewModel, { Props } from "./useNoAssociatedAccountsViewModel";

const makeProps = (params?: Partial<Props["route"]["params"]>) =>
  ({ route: { params } }) as unknown as Props;

describe("useNoAssociatedAccountsViewModel", () => {
  it("exposes the theme derived status color and spacing", () => {
    const { result } = renderHook(() => useNoAssociatedAccountsViewModel(makeProps()));

    expect(typeof result.current.statusColor).toBe("string");
    expect(result.current.space).toBeDefined();
  });

  it("passes through the route params", () => {
    const CustomNoAssociatedAccounts = () => React.createElement(React.Fragment);
    const onCloseNavigation = jest.fn();

    const { result } = renderHook(() =>
      useNoAssociatedAccountsViewModel(
        makeProps({ CustomNoAssociatedAccounts, onCloseNavigation }),
      ),
    );

    expect(result.current.CustomNoAssociatedAccounts).toBe(CustomNoAssociatedAccounts);
    expect(result.current.onCloseNavigation).toBe(onCloseNavigation);
  });

  it("does not crash when route params are missing", () => {
    const { result } = renderHook(() =>
      useNoAssociatedAccountsViewModel({ route: {} } as unknown as Props),
    );

    expect(result.current.CustomNoAssociatedAccounts).toBeUndefined();
    expect(result.current.onCloseNavigation).toBeUndefined();
  });
});
