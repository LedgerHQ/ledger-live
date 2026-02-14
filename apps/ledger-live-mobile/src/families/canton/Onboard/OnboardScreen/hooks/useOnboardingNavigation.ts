import type { CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useCallback } from "react";
import type { Dispatch } from "redux";
import { NavigatorName, ScreenName } from "~/const";
import {
  restoreNavigationSnapshot as restoreNavigationSnapshotImpl,
  type NavigationSnapshot,
} from "../../../utils/navigationSnapshot";
import type { OnboardScreenViewModelParams } from "../types";

interface UseOnboardingNavigationParams extends OnboardScreenViewModelParams {
  accountsToAdd: Account[];
  cryptoCurrency: CryptoOrTokenCurrency;
  dispatch: Dispatch;
  existingAccounts: Account[];
  restoreNavigationSnapshot?: (
    navigation: NavigationProp<ParamListBase>,
    snapshot: NavigationSnapshot | undefined,
  ) => void;
}

export function useOnboardingNavigation({
  navigation,
  route,
  accountsToAdd,
  cryptoCurrency,
  dispatch,
  existingAccounts,
  restoreNavigationSnapshot = restoreNavigationSnapshotImpl,
}: UseOnboardingNavigationParams) {
  const { isReonboarding = false, accountToReonboard, restoreState } = route.params ?? {};

  const navigateToSuccess = useCallback(() => {
    navigation.getParent()?.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AddAccountsSuccess,
      params: {
        accountsToAdd,
        currency: cryptoCurrency,
      },
    });
  }, [navigation, accountsToAdd, cryptoCurrency]);

  const finishOnboarding = useCallback(
    (onboardResult: CantonOnboardResult) => {
      const accountsToDispatch =
        isReonboarding && accountToReonboard
          ? [
              {
                ...accountToReonboard,
                ...onboardResult.account,
                id: accountToReonboard.id,
              },
            ]
          : (() => {
              const importableAccounts = accountsToAdd.filter(account => account.used);
              const completedAccount = onboardResult.account;

              const accounts = [...importableAccounts];
              if (completedAccount) {
                accounts.push(completedAccount);
              }

              return accounts;
            })();

      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: accountsToDispatch,
          selectedIds: accountsToDispatch.map(account => account.id),
          renamings: {},
        }),
      );

      if (isReonboarding) {
        if (restoreState) {
          restoreNavigationSnapshot(navigation, restoreState);
        } else {
          navigation.goBack();
        }
      } else {
        navigateToSuccess();
      }
    },
    [
      isReonboarding,
      accountToReonboard,
      accountsToAdd,
      dispatch,
      existingAccounts,
      restoreState,
      navigation,
      navigateToSuccess,
      restoreNavigationSnapshot,
    ],
  );

  return {
    navigateToSuccess,
    finishOnboarding,
  };
}
