import type { getStateFromPath } from "@react-navigation/native";
import { findCryptoCurrencyByKeyword } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";

type DeeplinkState = ReturnType<typeof getStateFromPath>;

type AccountsScreen = {
  name: ScreenName;
  params?: Record<string, unknown>;
};

function accountsScreenState(screen: AccountsScreen): DeeplinkState {
  return {
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
                routes: [screen],
              },
            },
          ],
        },
      },
    ],
  };
}

const accountsListScreen: AccountsScreen = {
  name: ScreenName.AccountsList,
  params: {
    sourceScreenName: ScreenName.Accounts,
    showHeader: true,
    canAddAccount: true,
    isSyncEnabled: true,
  },
};

export function handleAccountDeeplink({
  currency,
  address,
  accounts,
  hasCompletedOnboarding,
}: {
  currency: string | null;
  address: string | null;
  accounts: readonly Account[];
  hasCompletedOnboarding: boolean;
}): DeeplinkState | undefined {
  if (!hasCompletedOnboarding) return undefined;

  const paramCurrency = currency ? findCryptoCurrencyByKeyword(currency) : undefined;
  if (!paramCurrency) {
    return accountsScreenState(accountsListScreen);
  }

  const normalizedAddress = address?.toLowerCase();
  const matchedAccount = normalizedAddress
    ? accounts.find(
        account =>
          account.currency.id === paramCurrency.id &&
          account.freshAddress.toLowerCase() === normalizedAddress,
      )
    : undefined;

  if (matchedAccount) {
    return accountsScreenState({
      name: ScreenName.Account,
      params: { accountId: matchedAccount.id },
    });
  }

  return accountsScreenState({
    name: ScreenName.Asset,
    params: { currency: paramCurrency },
  });
}
