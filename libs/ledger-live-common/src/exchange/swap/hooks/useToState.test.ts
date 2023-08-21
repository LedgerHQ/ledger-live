import { renderHook, act } from "@testing-library/react-hooks";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { selectorStateDefaultValues, useToState } from ".";
import { genTokenAccount } from "@ledgerhq/coin-framework/mocks/account";
import { genAccount } from "../../../mock/account";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";

const BTC = getCryptoCurrencyById("bitcoin");
const ETH = getCryptoCurrencyById("ethereum");
const USDT = getTokenById("ethereum/erc20/usd_tether__erc20_");

const accounts: Account[] = [
  genAccount("mocked-account-1", { currency: BTC }),
  genAccount("mocked-account-2", { currency: ETH }),
];
const subAccount = genTokenAccount(1, accounts[1], USDT);

describe("useToState", () => {
  const defaultProps = { accounts };

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
