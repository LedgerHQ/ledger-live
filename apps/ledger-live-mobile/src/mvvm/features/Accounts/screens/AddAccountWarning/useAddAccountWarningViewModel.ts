import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import {
  getAddAccountCallbacks,
  unregisterAddAccountCallbacks,
} from "~/navigation/callbackRegistry";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/core";
import { useCallback } from "react";
import { AddAccountContexts } from "../AddAccount/enums";
import { track } from "~/analytics";
import useAnalytics from "LLM/hooks/useAnalytics";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsWarning>
>;

export default function useAddAccountWarningViewModel({ route }: Props) {
  const {
    emptyAccount,
    emptyAccountName,
    currency,
    context,
    onCloseNavigation: onCloseParam,
    callbackId,
  } = route.params || {};
  const registryCallbacks = callbackId ? getAddAccountCallbacks(callbackId) : undefined;
  const onCloseNavigation = registryCallbacks?.onCloseNavigation ?? onCloseParam;
  const { colors, space } = useTheme();
  const navigation = useNavigation();
  const { analyticsMetadata } = useAnalytics(context);

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

      const clickMetadata = analyticsMetadata[ScreenName.AddAccountsWarning]?.onSelectAccount;
      if (clickMetadata) track(clickMetadata.eventName, clickMetadata.payload);
    },
    [navigation, route.params, context, analyticsMetadata],
  );

  const handleOnCloseWarningScreen = useCallback(() => {
    if (callbackId) unregisterAddAccountCallbacks(callbackId);
    if (typeof onCloseNavigation === "function") {
      onCloseNavigation();
      return;
    }
    navigation.goBack();
  }, [navigation, onCloseNavigation, callbackId]);

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
