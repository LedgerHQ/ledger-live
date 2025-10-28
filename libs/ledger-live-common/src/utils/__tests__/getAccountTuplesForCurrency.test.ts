import { getCryptoCurrencyById, findTokenById } from "@ledgerhq/cryptoassets";
import { genAccount } from "../../mock/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountTuplesForCurrency } from "../getAccountTuplesForCurrency";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

initializeLegacyTokens(addTokens);

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

      const results = getAccountTuplesForCurrency(ethCurrency, allAccounts);

      expect(results).toHaveLength(2);
      results.forEach((result, index) => {
        expect(result.account).toEqual(ethAccounts[index]);
        expect(result.subAccount).toBeNull();
      });
    });

    test("returns an empty array if the CryptoCurrency passed has no associated account", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const allAccounts: Account[] = [getCosmosAccount(), getBtcAccount(), getPolkadotAccount()];

      const results = getAccountTuplesForCurrency(ethCurrency, allAccounts);

      expect(results).toHaveLength(0);
    });

    test("filters based on the accountId map", () => {
      const ethCurrency = getCryptoCurrencyById("ethereum");
      const ethAccounts = [getEthAccount(), getEthAccount(), getEthAccount(), getEthAccount()];

      const results = getAccountTuplesForCurrency(
        ethCurrency,
        ethAccounts,
        new Map([[ethAccounts[0].id, true]]),
      );

      expect(results).toHaveLength(1);
    });
  });

  describe("TokenCurrency", () => {
    const token = findTokenById("ethereum/erc20/aave");
    if (!token) throw new Error("AAVE token not found");
    const aaveToken = token;

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

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts);

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

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts);

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

      const results = getAccountTuplesForCurrency(aaveToken, allAccounts);
      expect(results).toHaveLength(0);
    });

    test("does not filter based on the accountId map", () => {
      const aaveAccounts = [
        { ...getEthAccount(), subAccounts: [aaveToken] },
        { ...getEthAccount(), subAccounts: [aaveToken] },
        { ...getEthAccount(), subAccounts: [aaveToken] },
        { ...getEthAccount(), subAccounts: [aaveToken] },
      ];

      const results = getAccountTuplesForCurrency(
        aaveToken,
        aaveAccounts,
        new Map([[aaveAccounts[0].id, true]]),
      );

      expect(results).toHaveLength(4);
    });
  });
});
