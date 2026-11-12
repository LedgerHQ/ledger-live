import { track } from "@shared/analytics";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/core";
import { useCallback } from "react";
import { AddAccountContexts } from "../AddAccount/enums";
import useAnalytics from "LLM/hooks/useAnalytics";
import { useReceiveScreen } from "LLM/features/Receive/hooks/useReceiveScreen";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsWarning>
>;

export default function useAddAccountWarningViewModel({ route }: Props) {
  const { emptyAccount, emptyAccountName, currency, context, onCloseNavigation } =
    route.params || {};
  const { colors, space } = useTheme();
  const navigation = useNavigation();
  const receiveScreen = useReceiveScreen();
  const { analyticsMetadata } = useAnalytics(context);

  const statusColor = colors.warning.c70;

  const goToAccounts = useCallback(
    (accountId: string) => () => {
      if (context === AddAccountContexts.AddAccounts) {
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      } else {
        navigation.navigate(
          NavigatorName.ReceiveFunds,
          receiveScreen({
            ...route.params,
            accountId,
          }),
        );
      }

      const clickMetadata = analyticsMetadata[ScreenName.AddAccountsWarning]?.onSelectAccount;
      if (clickMetadata) track(clickMetadata.eventName, clickMetadata.payload);
    },
    [navigation, route.params, context, analyticsMetadata, receiveScreen],
  );

  const handleOnCloseWarningScreen = useCallback(() => {
    if (typeof onCloseNavigation === "function") {
      onCloseNavigation();
      return;
    }
    navigation.goBack();
  }, [navigation, onCloseNavigation]);

  return {
    space,
    emptyAccount,
    emptyAccountName,
    currency,
    statusColor,
    goToAccounts,
    handleOnCloseWarningScreen,
  };
}
