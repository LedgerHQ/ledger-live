import { useCallback } from "react";
import { useModularDrawerController, useModularDrawerVisibility } from "../ModularDrawer";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorName, ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/native";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

type Props = {
  onClick?: () => void;
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
};
export function useOpenReceiveDrawer({ currency, sourceScreenName, onClick }: Props) {
  const navigation = useNavigation();
  const { openDrawer } = useModularDrawerController();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const isModularDrawerEnabled = isModularDrawerVisible({
    location: ModularDrawerLocation.RECEIVE_FLOW,
  });

  const openReceiveConfirmation = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      const accountCurrency = getAccountCurrency(account);

      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          parentId: parentAccount?.id,
          currency: accountCurrency,
          accountId: (account.type !== "Account" && account?.parentId) || account.id,
        },
      });
    },
    [navigation],
  );

  const handleOnclick = useCallback(() => {
    if (isModularDrawerEnabled) {
      return openDrawer({
        currencies: currency ? [currency.id] : [],
        flow: "receive_flow",
        source: sourceScreenName,
        areCurrenciesFiltered: !!currency,
        enableAccountSelection: true,
        onAccountSelected: openReceiveConfirmation,
      });
    } else {
      return onClick?.();
    }
  }, [
    currency,
    isModularDrawerEnabled,
    onClick,
    openDrawer,
    sourceScreenName,
    openReceiveConfirmation,
  ]);

  return {
    handleOpenReceiveDrawer: handleOnclick,
    isModularDrawerEnabled,
  };
}
