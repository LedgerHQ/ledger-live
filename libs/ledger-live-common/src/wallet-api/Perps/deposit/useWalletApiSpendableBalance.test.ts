/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "@testing-library/react";
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

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current?.toFixed()).toBe("10"));
  });

  it("is pending again, and never shows the old balance, when the account changes", async () => {
    const { result, rerender } = renderHook(
      ({ account }) => useWalletApiSpendableBalance(account, undefined),
      { initialProps: { account: aleo } },
    );
    await waitFor(() => expect(result.current?.toFixed()).toBe("10"));

    rerender({ account: other });

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current?.toFixed()).toBe("7"));
  });

  it("asks nothing without an account", () => {
    const { result } = renderHook(() => useWalletApiSpendableBalance(undefined, undefined));

    expect(result.current).toBeUndefined();
    expect(mockResolveWalletApiSpendableBalance).not.toHaveBeenCalled();
  });
});
