import { renderHook } from "@testing-library/react-hooks";
import BigNumber from "bignumber.js";

import { usePickDefaultAccount } from "./usePickDefaultAccount";
import { genAccount } from "../../../mock/account";
import { getCryptoCurrencyById } from "../../../currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { setSupportedCurrencies } from "../../../currencies";
setSupportedCurrencies(["ethereum"]);

function* accountGenerator(currency: CryptoCurrency): Generator<Account> {
  let id = 0;
  while (true) {
    id += 1;
    // operations are not taken into account by the usePickDefaultAccount hooks
    yield genAccount(`mocked-account-${id}`, { currency, operationsSize: 0 });
  }
}

const getAccountCreator = (currencyId: string) => {
  const generator = accountGenerator(getCryptoCurrencyById(currencyId));
  return () => generator.next().value;
};

describe("usePickDefaultAccount", () => {
  const getEthAccount = getAccountCreator("ethereum");
  const getBtcAccount = getAccountCreator("bitcoin");
  const setFromAccount = jest.fn();

  beforeEach(() => {
    setFromAccount.mockClear();
  });

  test("do nothing when fromAccount is not null/undefined", () => {
    const accounts: Account[] = [getEthAccount(), getBtcAccount()];

    renderHook(() =>
      usePickDefaultAccount(accounts, getEthAccount(), setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(0);
  });

  test("do nothing when all passed accounts are disabled", () => {
    const accounts: Account[] = [
      { ...getEthAccount(), disabled: true },
      { ...getBtcAccount(), disabled: true },
      { ...getEthAccount(), disabled: true },
      { ...getEthAccount(), disabled: true },
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(0);
  });

  test("returns an ethereum account when it's available", () => {
    const ethAccount = getEthAccount();
    ethAccount.balance = new BigNumber(1);

    const accounts: Account[] = [ethAccount, getBtcAccount()];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(ethAccount);
  });

  test("returns the first marketcap account when all of the enabled accounts have the same balance", () => {
    const ethAccount = getEthAccount();
    const btcAccount = getBtcAccount();
    btcAccount.balance = new BigNumber(1);

    const accounts: Account[] = [
      ethAccount,
      btcAccount,
      getEthAccount(),
      { ...getEthAccount(), disabled: true },
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(btcAccount);
  });

  test("returns the ethereum enabled account with the highest balance", () => {
    const ethAccount = getEthAccount();
    const ethAccount2 = getEthAccount();
    const ethAccount3 = getEthAccount();
    const ethAccount4 = getEthAccount();
    const ethAccount5 = getEthAccount();

    ethAccount.balance = new BigNumber(0.2);
    ethAccount2.balance = new BigNumber(0);
    ethAccount3.balance = new BigNumber(0.001);
    ethAccount4.balance = new BigNumber(0.0001);
    ethAccount5.balance = new BigNumber(0.0006);

    const accounts: Account[] = [
      { ...getEthAccount(), disabled: true },
      ethAccount,
      getBtcAccount(),
      ethAccount2,
      ethAccount3,
      ethAccount4,
      ethAccount5,
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(ethAccount);
  });

  test("returns the highest bitcoin account when no ethereum accounts are passed/enabled and all btc accounts have the same balance", () => {
    const btcAccount = getBtcAccount();
    const btcAccount2 = getBtcAccount();

    btcAccount.balance = new BigNumber(0.2);
    btcAccount2.balance = new BigNumber(0.001);

    const accounts: Account[] = [
      { ...getEthAccount(), disabled: true },
      btcAccount,
      btcAccount2,
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(btcAccount);
  });
});
