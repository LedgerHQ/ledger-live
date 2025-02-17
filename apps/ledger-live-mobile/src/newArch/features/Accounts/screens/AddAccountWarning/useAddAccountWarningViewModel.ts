import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/core";
import { useCallback } from "react";
import { AddAccountContexts } from "../AddAccount/enums";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsWarning>
>;

export default function useAddAccountWarningViewModel({ route }: Props) {
  const { emptyAccount, emptyAccountName, currency, context } = route.params || {};
  const { colors, space } = useTheme();
  const navigation = useNavigation();

  const statusColor = colors.warning.c70;

  const goToAccounts = useCallback(
    (accountId: string) => () => {
      if (context === AddAccountContexts.AddAccounts) {
        navigation.navigate(ScreenName.Account, {
          accountId,
        });
      } else {
        navigation.navigate(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            ...route.params,
            accountId,
          },
        });
      }
    },
    [navigation, route.params, context],
  );

  const handleOnCloseWarningScreen = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
