import { useNavigation } from "@react-navigation/core";
import { useCallback } from "react";
import { useTheme } from "styled-components/native";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { AddAccountContexts } from "../AddAccount/enums";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import useAnalytics from "~/newArch/hooks/useAnalytics";
import { track } from "~/analytics";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsSuccess>
>;
export default function useAddAccountSuccessViewModel({ route }: Props) {
  const { currency, accountsToAdd, context, onCloseNavigation } = route.params || {};
  const { colors, space } = useTheme();
  const navigation = useNavigation();
  const { analyticsMetadata } = useAnalytics(context);

  const keyExtractor = useCallback((item: AccountLikeEnhanced) => item?.id, []);

  const statusColor = colors.neutral.c100;

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

      const clickMetadata = analyticsMetadata[ScreenName.AddAccountsSuccess]?.onSelectAccount;
      if (clickMetadata) track(clickMetadata.eventName, clickMetadata.payload);
    },
    [navigation, route.params, context, analyticsMetadata],
  );

  return {
    space,
    currency,
    accountsToAdd,
    statusColor,
    goToAccounts,
    keyExtractor,
    onCloseNavigation,
  };
}
