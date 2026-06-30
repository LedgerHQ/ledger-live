import React, { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import useQuickActions, { QuickAction } from "~/hooks/useQuickActions";
import { QuickActionList, type QuickActionButtonProps } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

const SHARED_CONFIG = {
  variant: "small" as const,
  textVariant: "small" as const,
};
function PortfolioQuickActionsBar() {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const router = useRoute();
  const stakeLabel = getStakeLabelLocaleBased();
  const { t } = useTranslation();
  const { quickActionsList } = useQuickActions();

  const { SEND, RECEIVE, BUY, SWAP, STAKE } = quickActionsList;
  const { isEnabled: isNewSendFlowEnabled } = useNewSendFlowFeature();

  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(null, null, isNewSendFlowEnabled);
  }, [isNewSendFlowEnabled]);

  const onPress = useCallback(
    (action: QuickAction, eventButton: string) => {
      track("button_clicked", {
        button: eventButton,
        page: router.name,
        ...(SEND && SEND.route && action.route?.[0] === SEND.route[0] ? trackingProperties : {}),
      });
      if (action.customHandler) {
        action.customHandler();
      } else if (action.route) {
        navigation.navigate<keyof BaseNavigatorStackParamList>(...action.route);
      }
    },
    [navigation, router.name, SEND, trackingProperties],
  );

  const quickActionsData: QuickActionButtonProps[] = [
    BUY && {
      ...SHARED_CONFIG,
      Icon: BUY.icon,
      children: t("portfolio.quickActions.buy"),
      onPress: () => onPress(BUY, "quick_action_buy"),
      disabled: BUY.disabled,
    },
    SWAP && {
      ...SHARED_CONFIG,
      Icon: SWAP.icon,
      children: t("portfolio.quickActions.swap"),
      onPress: () => onPress(SWAP, "quick_action_swap"),
      disabled: SWAP.disabled,
    },
    SEND && {
      ...SHARED_CONFIG,
      Icon: SEND.icon,
      children: t("portfolio.quickActions.send"),
      onPress: () => onPress(SEND, "quick_action_send"),
      disabled: SEND.disabled,
    },
    RECEIVE && {
      ...SHARED_CONFIG,
      Icon: RECEIVE.icon,
      children: t("portfolio.quickActions.deposit"),
      onPress: () => onPress(RECEIVE, "quick_action_receive"),
      disabled: RECEIVE.disabled,
    },
    STAKE && {
      ...SHARED_CONFIG,
      Icon: STAKE.icon,
      children: t(stakeLabel),
      onPress: () => onPress(STAKE, "quick_action_stake"),
      disabled: STAKE.disabled,
    },
  ].filter(<T extends QuickActionButtonProps>(v: T | undefined): v is T => !!v);

  return (
    <QuickActionList
      data={quickActionsData}
      numColumns={5}
      id="asset_five_columns"
      testID="portfolio-quick-action-button"
    />
  );
}

export default PortfolioQuickActionsBar;
