import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import useQuickActions from "~/hooks/useQuickActions";
import { QuickActionList, type QuickActionButtonProps } from "@ledgerhq/native-ui";
import { TextVariants } from "@ledgerhq/native-ui/styles/theme";
import { track } from "~/analytics";
import { useRoute } from "@react-navigation/native";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { EntryOf } from "~/types/helpers";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

const SHARED_CONFIG = {
  variant: "small" as const,
  textVariant: "small" as TextVariants,
};
function PortfolioQuickActionsBar() {
  const navigation = useNavigation<StackNavigationProp<BaseNavigatorStackParamList>>();
  const router = useRoute();
  const stakeLabel = getStakeLabelLocaleBased();
  const { t } = useTranslation();
  const {
    quickActionsList: { SEND, RECEIVE, BUY, SWAP, STAKE },
  } = useQuickActions();

  const onNavigate = useCallback(
    (route: EntryOf<BaseNavigatorStackParamList>, eventButton: string) => {
      track("button_clicked", { button: eventButton, page: router.name });
      navigation.navigate<keyof BaseNavigatorStackParamList>(...route);
    },
    [navigation, router.name],
  );

  const quickActionsData: QuickActionButtonProps[] = [
    BUY && {
      ...SHARED_CONFIG,
      Icon: BUY.icon,
      children: t("portfolio.quickActions.buy"),
      onPress: () => onNavigate(BUY.route, "quick_action_buy"),
      disabled: BUY.disabled,
    },
    SWAP && {
      ...SHARED_CONFIG,
      Icon: SWAP.icon,
      children: t("portfolio.quickActions.swap"),
      onPress: () => onNavigate(SWAP.route, "quick_action_swap"),
      disabled: SWAP.disabled,
    },
    SEND && {
      ...SHARED_CONFIG,
      Icon: SEND.icon,
      children: t("portfolio.quickActions.send"),
      onPress: () => onNavigate(SEND.route, "quick_action_send"),
      disabled: SEND.disabled,
    },
    RECEIVE && {
      ...SHARED_CONFIG,
      Icon: RECEIVE.icon,
      children: t("portfolio.quickActions.deposit"),
      onPress: () => onNavigate(RECEIVE.route, "quick_action_receive"),
      disabled: RECEIVE.disabled,
    },
    STAKE && {
      ...SHARED_CONFIG,
      Icon: STAKE.icon,
      children: t(stakeLabel),
      onPress: () => onNavigate(STAKE.route, "quick_action_stake"),
      disabled: STAKE.disabled,
    },
  ].filter(<T extends QuickActionButtonProps>(v: T | undefined): v is T => !!v);

  return (
    <QuickActionList
      data={quickActionsData}
      numColumns={5}
      id="asset_five_columns"
      testID="portoflio-quick-action-button"
    />
  );
}

export default PortfolioQuickActionsBar;
