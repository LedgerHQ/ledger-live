import BigNumber from "bignumber.js";

import {
  pickExchangeRate,
  getAccountTuplesForCurrency,
  getAvailableAccountsById,
} from "./index";
import { getMockExchangeRate } from "../mock";
import { genAccount } from "../../../mock/account";
import type {
  Account,
  CryptoCurrency,
  SubAccount,
  TokenCurrency,
} from "../../../types";
import { getCryptoCurrencyById } from "../../../currencies";
import { getTokenById } from "@ledgerhq/cryptoassets/lib/tokens";

describe("swap/utils/pickExchangeRate", () => {
  test("calls the callback function with null when no exchange rates are passed", () => {
    const setExchangeRate = jest.fn();
    pickExchangeRate([], undefined, setExchangeRate);

    expect(setExchangeRate).toHaveBeenCalledTimes(1);
    expect(setExchangeRate).toHaveBeenCalledWith(null);
  });

  test("calls the callback function with null when no exchange rates are passed but there is an exchange rate", () => {
    const setExchangeRate = jest.fn();
    const exchangeRate = getMockExchangeRate({ provider: "wyre" });
    pickExchangeRate([], exchangeRate, setExchangeRate);

    expect(setExchangeRate).toHaveBeenCalledTimes(1);
    expect(setExchangeRate).toHaveBeenCalledWith(null);
  });

  test("calls the callback function with the first exchange rate when the exchange passed isn't included in the list", () => {
    const setExchangeRate = jest.fn();
    const firstExchangeRate = getMockExchangeRate({
      provider: "changelly",
      tradeMethod: "fixed",
    });
    const exchangeRates = [
      firstExchangeRate,
      getMockExchangeRate({ provider: "changelly", tradeMethod: "float" }),
    ];
    const exchangeRate = getMockExchangeRate({ provider: "wyre" });

    pickExchangeRate(exchangeRates, exchangeRate, setExchangeRate);

    expect(setExchangeRate).toHaveBeenCalledTimes(1);
    expect(setExchangeRate).toHaveBeenCalledWith(firstExchangeRate);
  });

  test("calls the callback function with the passed exchange rate when the exchange passed is included in the list", () => {
    const setExchangeRate = jest.fn();
    const exchangeRate = getMockExchangeRate({
      provider: "changelly",
      tradeMethod: "fixed",
    });
    const exchangeRates = [
      getMockExchangeRate({ provider: "changelly", tradeMethod: "float" }),
      exchangeRate,
    ];

    pickExchangeRate(exchangeRates, exchangeRate, setExchangeRate);

    expect(setExchangeRate).toHaveBeenCalledTimes(1);
    expect(setExchangeRate).toHaveBeenCalledWith(exchangeRate);
  });
});

/* TODO: Refacto these two function and move them to mock/account.ts if needed */
function* accountGenerator(currency: CryptoCurrency): Generator<Account> {
  let id = 0;
  while (true) {
    id += 1;
    yield genAccount(`mocked-account-${id}`, { currency, operationsSize: 0 });
  }
}
const getAccountCreator = (currencyId: string) => {
  const generator = accountGenerator(getCryptoCurrencyById(currencyId));
  return () => generator.next().value;
};

describe("swap/utils/getAccountTuplesForCurrency", () => {
  const getEthAccount = getAccountCreator("ethereum");
  const getBtcAccount = getAccountCreator("bitcoin");
  const getPolkadotAccount = getAccountCreator("polkadot");
  const getCosmosAccount = getAccountCreator("cosmos");

  describe("CryptoCurrency", () => {
    test("returns all accounts associated to the CryptoCurrency", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const ethAccounts = [getEthAccount(), getEthAccount()];
      const allAccounts: Account[] = [
        getCosmosAccount(),
        ...ethAccounts,
        getBtcAccount(),
        getPolkadotAccount(),
      ];

      const results = getAccountTuplesForCurrency(
        ethCurrency,
        allAccounts,
        false
      );

      expect(results).toHaveLength(2);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect(result.subAccount).toBeNull();
      });
    });

    test("returns only associated accounts if they have a balance greater than 0 when the flag is passed", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const richEthAccounts = [
        { ...getEthAccount(), balance: new BigNumber(10) },
        { ...getEthAccount(), balance: new BigNumber(10) },
      ];
      const poorEthAccounts = { ...getEthAccount(), balance: new BigNumber(0) };

      const allAccounts: Account[] = [
        getCosmosAccount(),
        ...richEthAccounts,
        poorEthAccounts,
        getBtcAccount(),
        getPolkadotAccount(),
      ];

      const results = getAccountTuplesForCurrency(
        ethCurrency,
        allAccounts,
        true
      );

      expect(results).toHaveLength(richEthAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(richEthAccounts[index]);
        expect(result.subAccount).toBeNull();
      });
    });

    test("returns an empty array if the CryptoCurrency passed has no associated account", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const allAccounts: Account[] = [
        getCosmosAccount(),
        getBtcAccount(),
        getPolkadotAccount(),
      ];

      const results = getAccountTuplesForCurrency(
        ethCurrency,
        allAccounts,
        false
      );

      expect(results).toHaveLength(0);
    });
  });

  describe("TokenCurrency", () => {
    const aaveToken = Object.freeze(getTokenById("ethereum/erc20/aave"));

    test("returns correct parent accounts including a new subAccount when a TokenCurrency is provided", () => {
      const ethAccounts = [
        { ...getEthAccount(), subAccounts: [] },
        { ...getEthAccount(), subAccounts: [] },
      ];
      const allAccounts: Account[] = [
        getCosmosAccount(),
        ...ethAccounts,
        getBtcAccount(),
        getPolkadotAccount(),
      ];

      const results = getAccountTuplesForCurrency(
        aaveToken,
        allAccounts,
        false
      );

      expect(results).toHaveLength(ethAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect(
          (result.subAccount as SubAccount & { token: TokenCurrency }).token
        ).toEqual(aaveToken);
      });
    });

    test("returns correct parent accounts including already existing subAccounts when a TokenCurrency is provided", () => {
      const ethAccounts = [{ ...getEthAccount(), subAccounts: [aaveToken] }];
      const allAccounts: Account[] = [
        getCosmosAccount(),
        ...ethAccounts,
        getBtcAccount(),
        getPolkadotAccount(),
      ];

      const results = getAccountTuplesForCurrency(
        aaveToken,
        allAccounts,
        false
      );

      expect(results).toHaveLength(ethAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect(
          (result.subAccount as SubAccount & { token: TokenCurrency }).token
        ).toEqual(aaveToken);
      });
    });

    test("returns an empty array when a TokenCurrency is provided but the accounts list is empty", () => {
      const allAccounts: Account[] = [];

      const results = getAccountTuplesForCurrency(
        aaveToken,
        allAccounts,
        false
      );
      expect(results).toHaveLength(0);
    });
  });
});

describe("swap/utils/getAvailableAccountsById", () => {
  const getEthAccount = getAccountCreator("ethereum");
  const getBtcAccount = getAccountCreator("bitcoin");
  const getPolkadotAccount = getAccountCreator("polkadot");
  const getCosmosAccount = getAccountCreator("cosmos");

  test("return the correct accounts after sorting/filtering them", () => {
    const [
      disabledAccount,
      higherBalanceAccount,
      lowerBalanceAccount,
      ...accounts
    ] = new Array(6).fill(null).map(getEthAccount);

    // mutate some accounts to test sorting/filtering
    disabledAccount.disabled = true;
    higherBalanceAccount.balance = new BigNumber(10);
    lowerBalanceAccount.balance = new BigNumber(2);

    const allAccounts: Account[] = [
      getCosmosAccount(),
      disabledAccount,
      higherBalanceAccount,
      lowerBalanceAccount,
      ...accounts,
      getBtcAccount(),
      getPolkadotAccount(),
    ];

    const results = getAvailableAccountsById("ethereum", allAccounts);
    expect(results).toHaveLength(5);
    expect(results[0].balance.toNumber()).toBeGreaterThan(0);
    expect(results[1].balance.toNumber()).toBeGreaterThan(0);
    expect(results[0].balance.toNumber()).toBeGreaterThan(
      results[1].balance.toNumber()
    );
  });
});
