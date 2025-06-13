import { getTokenById } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "../currencies";
import { genAccount } from "../mock/account";
import { getAccountTuplesForCurrency } from "./helpers";

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

describe("getAccountTuplesForCurrency", () => {
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

      const results = getAccountTuplesForCurrency(ethCurrency, allAccounts, false);

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

      const results = getAccountTuplesForCurrency(ethCurrency, allAccounts, true);

      expect(results).toHaveLength(richEthAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(richEthAccounts[index]);
        expect(result.subAccount).toBeNull();
      });
    });

    test("returns an empty array if the CryptoCurrency passed has no associated account", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const allAccounts: Account[] = [getCosmosAccount(), getBtcAccount(), getPolkadotAccount()];

      const results = getAccountTuplesForCurrency(ethCurrency, allAccounts, false);

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

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts, false);

      expect(results).toHaveLength(ethAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect((result.subAccount as TokenAccount & { token: TokenCurrency }).token).toEqual(
          aaveToken,
        );
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

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts, false);

      expect(results).toHaveLength(ethAccounts.length);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect((result.subAccount as TokenAccount & { token: TokenCurrency }).token).toEqual(
          aaveToken,
        );
      });
    });

    test("returns an empty array when a TokenCurrency is provided but the accounts list is empty", () => {
      const allAccounts: Account[] = [];

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts, false);
      expect(results).toHaveLength(0);
    });
  });
});
