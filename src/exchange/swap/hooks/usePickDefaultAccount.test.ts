import { renderHook } from "@testing-library/react-hooks";
import BigNumber from "bignumber.js";

import { usePickDefaultAccount } from "./usePickDefaultAccount";
import { genAccount } from "../../../mock/account";
import type { Account, CryptoCurrency } from "../../../types";
import { getCryptoCurrencyById } from "../../../currencies";

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
  const getPolkadotAccount = getAccountCreator("polkadot");
  const getCosmosAccount = getAccountCreator("cosmos");
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

    const accounts: Account[] = [ethAccount, getBtcAccount()];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(ethAccount);
  });

  test("returns the first ethereum account when all of the enabled accounts have the same balance", () => {
    const ethAccount = getEthAccount();

    const accounts: Account[] = [
      ethAccount,
      getBtcAccount(),
      getEthAccount(),
      { ...getEthAccount(), disabled: true },
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(ethAccount);
  });

  test("returns the ethereum enabled account with the highest balance", () => {
    const ethAccount = getEthAccount();
    const ethAccount2 = getEthAccount();

    ethAccount.amount = new BigNumber(1000);
    ethAccount2.amount = new BigNumber(0);

    const accounts: Account[] = [
      { ...getEthAccount(), disabled: true },
      ethAccount,
      getBtcAccount(),
      ethAccount2,
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(ethAccount);
  });

  test("returns the first bitcoin account when no ethereum accounts are passed/enabled and all btc accounts have the same balance", () => {
    const BtcAccount = getBtcAccount();

    const accounts: Account[] = [
      { ...getEthAccount(), disabled: true },
      BtcAccount,
      getBtcAccount(),
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(BtcAccount);
  });

  test("returns the bitcoin enabled account with the highest balance when no ETH accounts are passed", () => {
    const btcAccount = getBtcAccount();
    const btcAccount2 = getBtcAccount();

    btcAccount.amount = new BigNumber(1000);
    btcAccount2.amount = new BigNumber(0);

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

  test("returns the first enabled account when no ethereum/bitcoin accounts are passed", () => {
    const dotAccount = getPolkadotAccount();

    const accounts: Account[] = [
      { ...getCosmosAccount(), disabled: true },
      dotAccount,
      getPolkadotAccount(),
      getCosmosAccount(),
    ];

    renderHook(() =>
      usePickDefaultAccount(accounts, undefined, setFromAccount)
    );

    expect(setFromAccount).toHaveBeenCalledTimes(1);
    expect(setFromAccount).toHaveBeenCalledWith(dotAccount);
  });
});
