import { getTokenById } from "@ledgerhq/cryptoassets";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "../../../currencies";
import { genAccount } from "../../../mock/account";
import {
  getAccountTuplesForCurrency,
  getAvailableAccountsById,
  getProviderName,
  KYCStatus,
  shouldShowKYCBanner,
  shouldShowLoginBanner,
} from "./index";

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

describe("swap/utils/shouldShowLoginBanner", () => {
  test("should not display Login banner if no provider is specified", () => {
    const result = shouldShowLoginBanner({
      provider: undefined,
      token: "token",
    });

    expect(result).toBe(false);
  });

  ["changelly", "wyre"].forEach((provider) => {
    test(`should not display Login banner for ${provider}`, () => {
      const result = shouldShowLoginBanner({
        provider,
        token: "token",
      });

      expect(result).toBe(false);
    });
  });

  ["ftx", "ftxus"].forEach((provider) => {
    describe(`${provider.toUpperCase()}`, () => {
      test("should display Login banner if no token is provided", () => {
        const result = shouldShowLoginBanner({
          provider: provider,
          token: undefined,
        });

        expect(result).toBe(true);
      });

      test("should display Login banner if token is expired", () => {
        /**
         * TODO: add test by mocking `isJwtExpired`
         */
      });

      test("should not display Login banner if token is not expired", () => {
        /**
         * TODO: add test by mocking `isJwtExpired`
         */
      });
    });
  });
});

describe("swap/utils/shouldShowKYCBanner", () => {
  test("should not display KYC banner if no provider is specified", () => {
    const result = shouldShowKYCBanner({
      provider: undefined,
      kycStatus: "rejected",
    });

    expect(result).toBe(false);
  });

  test("should not display KYC banner if provider does not require KYC", () => {
    const result = shouldShowKYCBanner({
      provider: "changelly",
      kycStatus: "rejected",
    });

    expect(result).toBe(false);
  });

  ["ftx", "ftxus", "wyre"].forEach((provider) => {
    describe(`${provider.toUpperCase()}`, () => {
      ["pending", "upgradeRequired", "rejected"].forEach((status) => {
        test(`should display KYC banner if kycStatus is ${status}`, () => {
          const result = shouldShowKYCBanner({
            provider,
            kycStatus: status as KYCStatus,
          });

          expect(result).toBe(true);
        });
      });

      test("should not display KYC banner if kycStatus is approved", () => {
        const result = shouldShowKYCBanner({
          provider,
          kycStatus: "approved",
        });

        expect(result).toBe(false);
      });
    });
  });
});

describe("swap/utils/getProviderName", () => {
  test("should return uppercase provider name for ftx", () => {
    const expectedResult = "FTX";

    const result = getProviderName("ftx");

    expect(result).toBe(expectedResult);
  });

  test("should return uppercase provider name for ftxus", () => {
    const expectedResult = "FTXUS";

    const result = getProviderName("ftxus");

    expect(result).toBe(expectedResult);
  });

  test("should return capitalized provider name for other provider", () => {
    const expectedResult = "Changelly";

    const result = getProviderName("changelly");

    expect(result).toBe(expectedResult);
  });
});
