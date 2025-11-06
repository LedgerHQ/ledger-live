import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "../../mock/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAccountTuplesForCurrency } from "../getAccountTuplesForCurrency";
import { setupMockCryptoAssetsStore } from "../../test-helpers/cryptoAssetsStore";

// Setup mock store for unit tests
setupMockCryptoAssetsStore();

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
    const aaveToken = {
      type: "TokenCurrency" as const,
      id: "ethereum/erc20/aave",
      name: "Aave Token",
      ticker: "AAVE",
      units: [{ name: "Aave Token", code: "AAVE", magnitude: 18 }],
      contractAddress: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
      parentCurrency: getCryptoCurrencyById("ethereum"),
      tokenType: "erc20" as const,
    };

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
