import { useCallback } from "react";
import { useModularDrawerController } from "../ModularDrawer";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { useReceiveNoahEntry } from "../Noah/useNoahEntryPoint";
import { useReceiveOptionsDrawerController } from "./useReceiveOptionsDrawerController";

type Props = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  navigationOverride?: RootNavigation;
  hideBackButton?: boolean;
  fromMenu?: boolean;
};
export function useOpenReceiveDrawer({
  currency,
  sourceScreenName,
  navigationOverride,
  hideBackButton,
  fromMenu,
}: Props) {
  const defaultNavigation = useNavigation();
  const { openDrawer } = useModularDrawerController();
  const { openDrawer: openReceiveOptionsDrawer } = useReceiveOptionsDrawerController();

  const { showNoahMenu } = useReceiveNoahEntry({
    currency: currency,
    fromMenu: fromMenu,
  });

  const openReceiveConfirmation = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      const accountCurrency = getAccountCurrency(account);

      const confirmationParams = {
        parentId: parentAccount?.id,
        currency: accountCurrency,
        accountId: (account.type !== "Account" && account?.parentId) || account.id,
      };

      // Navigate to ReceiveFunds > ReceiveConfirmation
      // If navigationOverride is provided (e.g., from onboarding), it can navigate to BaseOnboarding > ReceiveFunds
      // Otherwise, use the default navigation context
      if (navigationOverride) {
        navigationOverride.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.ReceiveFunds,
          params: {
            screen: ScreenName.ReceiveConfirmation,
            params: confirmationParams,
          },
        });
      } else {
        defaultNavigation.navigate(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            ...confirmationParams,
            hideBackButton: hideBackButton ?? true,
          },
        });
      }
    },
    [defaultNavigation, navigationOverride, hideBackButton],
  );

  const handleOnclick = useCallback(
    (fromReceiveOptionsDrawer: boolean = false) => {
      if (showNoahMenu && !fromReceiveOptionsDrawer) {
        openReceiveOptionsDrawer({
          currency: currency,
          sourceScreenName: sourceScreenName,
          fromMenu: fromMenu,
        });
      } else {
        return openDrawer({
          currencies: currency ? [currency.id] : [],
          flow: "receive_flow",
          source: sourceScreenName,
          areCurrenciesFiltered: !!currency,
          enableAccountSelection: true,
          onAccountSelected: openReceiveConfirmation,
        });
      }
    },
    [
      currency,
      openDrawer,
      sourceScreenName,
      openReceiveConfirmation,
      showNoahMenu,
      openReceiveOptionsDrawer,
      fromMenu,
    ],
  );

  return {
    handleOpenReceiveDrawer: handleOnclick,
  };
}
