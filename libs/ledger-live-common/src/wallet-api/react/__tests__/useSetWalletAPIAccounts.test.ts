/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { AccountLike } from "@ledgerhq/types-live";

const mockSetWalletApiIdForAccountId = jest.fn();

jest.mock("../../converters", () => ({
  setWalletApiIdForAccountId: (id: string) => mockSetWalletApiIdForAccountId(id),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { useSetWalletAPIAccounts } = require("../useSetWalletAPIAccounts");

function account(id: string): AccountLike {
  return { id } as AccountLike;
}

describe("useSetWalletAPIAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers each account id on mount", () => {
    const accounts = [account("a"), account("b")];
    renderHook(() => useSetWalletAPIAccounts(accounts));

    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledTimes(2);
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledWith("a");
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledWith("b");
  });

  it("does nothing for an empty accounts array", () => {
    renderHook(() => useSetWalletAPIAccounts([]));
    expect(mockSetWalletApiIdForAccountId).not.toHaveBeenCalled();
  });

  it("does not re-run when the accounts reference is stable", () => {
    const accounts = [account("a")];
    const { rerender } = renderHook(() => useSetWalletAPIAccounts(accounts));
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledTimes(1);
  });

  it("re-runs when the accounts reference changes", () => {
    const { rerender } = renderHook(props => useSetWalletAPIAccounts(props), {
      initialProps: [account("a")],
    });
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledTimes(1);

    rerender([account("a"), account("c")]);
    expect(mockSetWalletApiIdForAccountId).toHaveBeenCalledTimes(3);
    expect(mockSetWalletApiIdForAccountId).toHaveBeenLastCalledWith("c");
  });
});
