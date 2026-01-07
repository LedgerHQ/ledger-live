/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook, act } from "@testing-library/react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { selectorStateDefaultValues, useToState } from ".";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
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

const selectedAccount = genAccount("mocked-account-selected", { currency: ETH });

const accounts: Account[] = [
  genAccount("mocked-account-1", { currency: BTC }),
  genAccount("mocked-account-2", { currency: ETH }),
];
const subAccount = genTokenAccount(1, accounts[1], USDT);

describe("useToState", () => {
  const defaultProps = { accounts, fromCurrencyAccount: selectedAccount };

  it("should initialize a blank state", () => {
    const { result } = renderHook(useToState, { initialProps: defaultProps });
    expect(result.current.toState).toMatchObject(selectorStateDefaultValues);
  });

  it("should set the account", async () => {
    const [currency, account, parentAccount] = [USDT, subAccount, accounts[1]];
    const { result } = renderHook(useToState, { initialProps: defaultProps });
    act(() => result.current.setToAccount(currency, account, parentAccount));
    expect(result.current.toState).toMatchObject({
      account,
      parentAccount,
      currency,
    });
  });

  it("should set the amount", () => {
    const amount = new BigNumber(10);
    const { result } = renderHook(useToState, { initialProps: defaultProps });
    act(() => result.current.setToAmount(amount));
    expect(result.current.toState.amount).toBe(amount);
  });

  it("should set the currency", () => {
    const { result } = renderHook(useToState, { initialProps: defaultProps });
    act(() => result.current.setToCurrency(BTC));
    expect(result.current.toState).toMatchObject({
      account: accounts[0],
      parentAccount: null,
      currency: BTC,
    });
  });
});
