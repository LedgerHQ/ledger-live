/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useWalletApiSpendableBalance } from "./useWalletApiSpendableBalance";

const mockResolveWalletApiSpendableBalance = jest.fn<Promise<BigNumber>, [AccountLike]>();
jest.mock("../../converters", () => ({
  resolveWalletApiSpendableBalance: (account: AccountLike) =>
    mockResolveWalletApiSpendableBalance(account),
}));

const aleo = { id: "aleo-1", spendableBalance: new BigNumber(510) } as unknown as AccountLike;
const other = { id: "aleo-2", spendableBalance: new BigNumber(7) } as unknown as AccountLike;

describe("useWalletApiSpendableBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveWalletApiSpendableBalance.mockImplementation(async account =>
      account === aleo ? new BigNumber(10) : account.spendableBalance,
    );
  });

  it("is pending until the bridge answers, then gives the Wallet API balance", async () => {
    const { result } = renderHook(() => useWalletApiSpendableBalance(aleo, undefined));

    expect(result.current.balance).toBeUndefined();
    await waitFor(() => expect(result.current.balance?.toFixed()).toBe("10"));
  });

  it("is pending again, and never shows the old balance, when the account changes", async () => {
    const { result, rerender } = renderHook(
      ({ account }) => useWalletApiSpendableBalance(account, undefined),
      { initialProps: { account: aleo } },
    );
    await waitFor(() => expect(result.current.balance?.toFixed()).toBe("10"));

    rerender({ account: other });

    expect(result.current.balance).toBeUndefined();
    await waitFor(() => expect(result.current.balance?.toFixed()).toBe("7"));
  });

  it("keeps the balance of the same account while a store refresh resolves it again", async () => {
    let finishRefresh: (balance: BigNumber) => void = () => {};
    const { result, rerender } = renderHook(
      ({ account }) => useWalletApiSpendableBalance(account, undefined),
      { initialProps: { account: aleo } },
    );
    await waitFor(() => expect(result.current.balance?.toFixed()).toBe("10"));
    mockResolveWalletApiSpendableBalance.mockImplementation(
      () => new Promise(resolve => (finishRefresh = resolve)),
    );

    rerender({ account: { ...aleo } as AccountLike });

    expect(result.current).toEqual({ balance: new BigNumber(10), isRefreshing: true });

    await act(async () => finishRefresh(new BigNumber(12)));

    expect(result.current).toEqual({ balance: new BigNumber(12), isRefreshing: false });
  });

  it("asks nothing without an account", () => {
    const { result } = renderHook(() => useWalletApiSpendableBalance(undefined, undefined));

    expect(result.current.balance).toBeUndefined();
    expect(mockResolveWalletApiSpendableBalance).not.toHaveBeenCalled();
  });
});
