import { Account, TokenAccount } from "@ledgerhq/types-live";

import useQuickActions from "~/hooks/useQuickActions";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { StyleProp, ViewStyle } from "react-native";
import { track } from "~/analytics";
import { AnalyticButtons, AnalyticEvents } from "LLM/hooks/useAnalytics/enums";
import { NavigatorName, ScreenName } from "~/const";

type ActionItem = {
  title: string;
  description: string;
  tag?: string;
  Icon: IconType;
  onPress?: (() => void) | null;
  onDisabledPress?: () => void;
  disabled?: boolean;
  event?: string;
  eventProperties?: Parameters<typeof track>[1];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function useAccountQuickActionDrawerViewModel({
  currency,
  account,
}: {
  currency: CryptoOrTokenCurrency;
  account: Account | TokenAccount;
}) {
  const {
    quickActionsList: { RECEIVE, BUY },
  } = useQuickActions({ currency, accounts: [account] });
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const { t } = useTranslation();

  const actions: ActionItem[] = [
    RECEIVE && {
      eventProperties: {
        button: AnalyticButtons.Receive,
        page: AnalyticEvents.FundingQuickAction,
      },
      title: t("transfer.receive.title"),
      description: t("transfer.receive.description"),
      onPress: () =>
        navigation.navigate<keyof BaseNavigatorStackParamList>(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params: {
            accountId: (account.type !== "Account" && account?.parentId) || account.id,
          },
        }),
      Icon: RECEIVE.icon,
      disabled: RECEIVE.disabled,
      testID: "action-drawer-receive-button",
    },
    BUY && {
      eventProperties: {
        button: AnalyticButtons.Buy,
        page: AnalyticEvents.FundingQuickAction,
      },
      title: t("transfer.buy.title"),
      description: t("transfer.buy.description"),
      Icon: BUY.icon,
      onPress: () =>
        navigation.navigate<keyof BaseNavigatorStackParamList>(NavigatorName.Exchange, {
          screen: ScreenName.ExchangeBuy,
          params: {
            defaultAccountId: account?.id,
            defaultCurrencyId: currency.id,
          },
        }),
      disabled: BUY.disabled,
      testID: "action-drawer--buy-button",
    },
  ].filter(<T extends ActionItem>(v: T | undefined): v is T => !!v);

  return {
    actions,
  };
}
