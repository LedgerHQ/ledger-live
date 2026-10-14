import { track } from "@shared/analytics";
import { useNavigation } from "@react-navigation/core";
import { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { AddAccountContexts } from "../AddAccount/enums";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import useAnalytics from "LLM/hooks/useAnalytics";

export type Props = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.AddAccountsSuccess>
>;
export default function useAddAccountSuccessViewModel({ route }: Props) {
  const { currency, accountsToAdd, context, onCloseNavigation, onDone, navigationDepth } =
    route.params || {};
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

  // Done hands the accounts over, then pops back to the screen that started the flow instead
  // of the stack's root, which would unmount the origin (e.g. the Perps live app).
  const onDonePress = useMemo(
    () =>
      onDone
        ? () => {
            onDone(accountsToAdd);
            navigation
              .getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()
              ?.pop(navigationDepth ?? 2);
          }
        : onCloseNavigation,
    [onDone, accountsToAdd, navigation, navigationDepth, onCloseNavigation],
  );

  return {
    space,
    currency,
    accountsToAdd,
    statusColor,
    goToAccounts,
    keyExtractor,
    onCloseNavigation: onDonePress,
    isDoneFlow: !!onDone,
  };
}
