/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { renderHook, act } from "@testing-library/react";
import BigNumber from "bignumber.js";
import { selectorStateDefaultValues } from ".";
import useBridgeTransaction from "../../../bridge/useBridgeTransaction";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import { useFromState } from "./useFromState";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
LiveConfig.setConfig({
  config_currency_bitcoin: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ethereum: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
});
const USDT = {
  type: "TokenCurrency" as const,
  id: "ethereum/erc20/usd_tether__erc20_",
  name: "Tether USD (ERC-20)",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrency: ETH,
  tokenType: "erc20" as const,
};

jest.useFakeTimers();

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

  test("call hook and set the amount after 400ms", () => {
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
        amount: undefined,
      },
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        amount: new BigNumber(10),
      },
    });
  });

  test("call hook and set the the most recent amount input after 400ms", () => {
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
        amount: undefined,
      },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        amount: undefined,
      },
    });

    act(() => {
      result.current.setFromAmount(new BigNumber(20));
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        amount: undefined,
      },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toMatchObject({
      fromState: {
        ...selectorStateDefaultValues,
        amount: new BigNumber(20),
      },
    });
  });
});
