import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { NavigatorName, ScreenName } from "~/const";
import { handleAccountDeeplink } from "../handleAccountDeeplink";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const bitcoinAccount = genAccount("account-deeplink-btc", { currency: bitcoin });
const ethereumAccount = genAccount("account-deeplink-eth", { currency: ethereum });

const accountsListState = {
  routes: [
    {
      name: NavigatorName.Base,
      state: {
        index: 1,
        routes: [
          { name: NavigatorName.Main },
          {
            name: NavigatorName.Accounts,
            state: {
              routes: [
                {
                  name: ScreenName.AccountsList,
                  params: {
                    sourceScreenName: ScreenName.Accounts,
                    showHeader: true,
                    canAddAccount: true,
                    isSyncEnabled: true,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

function screenRoute(result: ReturnType<typeof handleAccountDeeplink>) {
  return result?.routes[0].state?.routes[1]?.state?.routes[0];
}

const onboarded = { hasCompletedOnboarding: true };

describe("handleAccountDeeplink", () => {
  it("ignores the link before onboarding is completed", () => {
    const result = handleAccountDeeplink({
      currency: "ethereum",
      address: ethereumAccount.freshAddress,
      accounts: [ethereumAccount],
      hasCompletedOnboarding: false,
    });

    expect(result).toBeUndefined();
  });

  it("opens the accounts list when the link has no currency", () => {
    const result = handleAccountDeeplink({
      currency: null,
      address: null,
      accounts: [bitcoinAccount],
      ...onboarded,
    });

    expect(result).toEqual(accountsListState);
  });

  it("opens the accounts list when the currency is unknown", () => {
    const result = handleAccountDeeplink({
      currency: "not-a-currency",
      address: bitcoinAccount.freshAddress,
      accounts: [bitcoinAccount],
      ...onboarded,
    });

    expect(result).toEqual(accountsListState);
  });

  it("opens the account when the address matches that currency", () => {
    const result = handleAccountDeeplink({
      currency: "ethereum",
      address: ethereumAccount.freshAddress.toUpperCase(),
      accounts: [bitcoinAccount, ethereumAccount],
      ...onboarded,
    });

    expect(screenRoute(result)).toEqual({
      name: ScreenName.Account,
      params: { accountId: ethereumAccount.id },
    });
  });

  it("opens the currency page when the address does not match an account", () => {
    const result = handleAccountDeeplink({
      currency: "bitcoin",
      address: "bc1q-not-this-wallet",
      accounts: [bitcoinAccount],
      ...onboarded,
    });

    expect(screenRoute(result)).toEqual({
      name: ScreenName.Asset,
      params: { currency: bitcoin },
    });
  });

  it("opens the currency page when only the currency is provided", () => {
    const result = handleAccountDeeplink({
      currency: "BTC",
      address: null,
      accounts: [bitcoinAccount],
      ...onboarded,
    });

    expect(screenRoute(result)).toEqual({
      name: ScreenName.Asset,
      params: { currency: bitcoin },
    });
  });

  it("places Main behind the destination so back returns to the portfolio", () => {
    const result = handleAccountDeeplink({
      currency: null,
      address: null,
      accounts: [],
      ...onboarded,
    });

    const baseState = result?.routes[0].state;
    expect(baseState?.index).toBe(1);
    expect(baseState?.routes[0]).toEqual({ name: NavigatorName.Main });
  });
});
