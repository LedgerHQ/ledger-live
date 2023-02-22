import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react-hooks";
import BigNumber from "bignumber.js";
import { selectorStateDefaultValues } from ".";
import useBridgeTransaction from "../../../bridge/useBridgeTransaction";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import { useFromState } from "./useFromState";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
const USDT = getTokenById("ethereum/erc20/usd_tether__erc20_");

const mockedAccounts: Account[] = [
  genAccount("mocked-account-1"),
  genAccount("mocked-account-2", {
    currency: ETH,
  }),
];
const mockedTokenAccount = genTokenAccount(1, mockedAccounts[1], USDT);
const allAccounts = [...mockedAccounts, mockedTokenAccount] as Account[];

describe("useFromState", () => {
  test("call hook without arguments", () => {
    const { result } = renderHook(() => {
      const bridgeTransaction = useBridgeTransaction();
      return useFromState({
        bridgeTransaction,
      });
    });
    expect(result.current).toMatchObject({
      fromState: selectorStateDefaultValues,
    });
  });

  test("call hook with default currency", () => {
    const defaultCurrency = BTC;

    const { result } = renderHook(() => {
      const bridgeTransaction = useBridgeTransaction();
      return useFromState({
        defaultCurrency,
        bridgeTransaction,
      });
    });
    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        currency: defaultCurrency,
      },
    });
  });

  test("call hook with default accounts", () => {
    const defaultAccount = mockedTokenAccount;
    const defaultParentAccount = mockedAccounts[1];

    const { result } = renderHook(() => {
      const bridgeTransaction = useBridgeTransaction();
      return useFromState({
        defaultAccount,
        defaultParentAccount,
        bridgeTransaction,
      });
    });
    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        account: defaultAccount,
        parentAccount: defaultParentAccount,
      },
    });
  });

  test("call hook and set the account and all the related properties", () => {
    const { result } = renderHook(() => {
      const bridgeTransaction = useBridgeTransaction();
      return {
        ...useFromState({
          accounts: allAccounts,
          bridgeTransaction,
        }),
        bridgeTransaction,
      };
    });

    expect(result.current).toMatchObject({
      fromState: selectorStateDefaultValues,
    });

    act(() => {
      result.current.setFromAccount(mockedTokenAccount);
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        account: mockedTokenAccount,
        parentAccount: mockedAccounts[1],
        currency: USDT,
      },
    });

    expect(result.current.bridgeTransaction).toMatchObject({
      account: mockedTokenAccount,
      parentAccount: mockedAccounts[1],
    });
  });

  test("call hook and set the amount", () => {
    const { result } = renderHook(() => {
      const bridgeTransaction = useBridgeTransaction();
      return useFromState({
        accounts: allAccounts,
        bridgeTransaction,
      });
    });

    expect(result.current).toMatchObject({
      fromState: selectorStateDefaultValues,
    });

    act(() => {
      result.current.setFromAmount(new BigNumber(10));
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        amount: new BigNumber(10),
      },
    });
  });
});
