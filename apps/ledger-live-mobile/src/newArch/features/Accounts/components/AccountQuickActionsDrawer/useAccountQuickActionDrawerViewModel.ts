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
  accounts,
}: {
  currency: CryptoOrTokenCurrency;
  accounts: Account[] | TokenAccount[];
}) {
  const {
    quickActionsList: { RECEIVE, BUY },
  } = useQuickActions({ currency, accounts });
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const { t } = useTranslation();

  const actions: ActionItem[] = [
    RECEIVE && {
      eventProperties: {
        button: "transfer_receive",
        //page, TODO: add it in the analytics ticket
        drawer: "trade",
      },
      title: t("transfer.receive.title"),
      description: t("transfer.receive.description"),
      onPress: () =>
        navigation.navigate<keyof BaseNavigatorStackParamList>(...(RECEIVE && RECEIVE.route)),
      Icon: RECEIVE.icon,
      disabled: RECEIVE.disabled,
      testID: "transfer-receive-button",
    },
    BUY && {
      eventProperties: {
        button: "transfer_buy",
        //page, TODO: add it in the analytics ticket
        drawer: "trade",
      },
      title: t("transfer.buy.title"),
      description: t("transfer.buy.description"),
      Icon: BUY.icon,
      onPress: () => navigation.navigate<keyof BaseNavigatorStackParamList>(...BUY.route),
      disabled: BUY.disabled,
      testID: "transfer-buy-button",
    },
  ].filter(<T extends ActionItem>(v: T | undefined): v is T => !!v);

  return {
    actions,
  };
}
