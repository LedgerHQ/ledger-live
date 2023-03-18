import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react-hooks";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import { useReverseAccounts } from "./useReverseAccounts";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
const USDT = getTokenById("ethereum/erc20/usd_tether__erc20_");

const fromParentAccount = genAccount("mocked-account-2", {
  currency: ETH,
});
const fromAccount = genTokenAccount(1, fromParentAccount, USDT);
const toAccount = genAccount("mocked-account-1", { currency: BTC });
const allAccounts = [fromAccount, fromParentAccount, toAccount] as Account[];

describe("useReverseAccounts", () => {
  const setFromAccount = jest.fn();
  const setToAccount = jest.fn();

  const defaultProps: Parameters<typeof useReverseAccounts>[0] = {
    accounts: allAccounts,
    fromAccount,
    fromParentAccount,
    toAccount,
    fromCurrency: USDT,
    setFromAccount,
    setToAccount,
  };

  it("should tell if the accounts are swappable", () => {
    const { result, rerender } = renderHook(
      (props) => useReverseAccounts(props),
      {
        initialProps: defaultProps,
      }
    );

    expect(result.current.isSwapReversable).toBe(true);

    rerender({ ...defaultProps, toAccount: undefined });
    expect(result.current.isSwapReversable).toBe(false);

    rerender({ ...defaultProps, fromCurrency: undefined });
    expect(result.current.isSwapReversable).toBe(false);

    rerender({
      ...defaultProps,
      // detached account - not in the main accounts list
      toAccount: genAccount("mocked-account-3", { currency: BTC }),
    });
    expect(result.current.isSwapReversable).toBe(false);
  });

  it("should reverse accounts when 'reverseSwap' is called", () => {
    const { result, rerender } = renderHook(useReverseAccounts, {
      initialProps: {
        setToAccount,
        setFromAccount,
      } as any,
    });

    // if isSwapReversable is false, then reverseSwap should be a no-op
    expect(result.current.isSwapReversable).toBe(false);
    act(() => result.current.reverseSwap());
    expect(setToAccount).toHaveBeenCalledTimes(0);
    expect(setFromAccount).toHaveBeenCalledTimes(0);

    // Reverse from/to accounts
    rerender(defaultProps);
    expect(result.current.isSwapReversable).toBe(true);
    act(() => result.current.reverseSwap());
    expect(setToAccount).toHaveBeenCalledTimes(1);
    expect(setToAccount.mock.calls[0]).toMatchObject([
      USDT,
      fromAccount,
      fromParentAccount,
    ]);
    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount.mock.calls[0]).toMatchObject([toAccount]);
  });
});
