import { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { TransferVertical, Exchange, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsCountSelector, areAccountsEmptySelector } from "~/reducers/accounts";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { track } from "~/analytics";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { QuickActionCta } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";

interface UseQuickActionsCtasViewModelProps {
  sourceScreenName?: string;
}

interface QuickActionsCtasViewModel {
  quickActions: readonly QuickActionCta[];
}

export const useQuickActionsCtasViewModel = ({
  sourceScreenName,
}: UseQuickActionsCtasViewModelProps = {}): QuickActionsCtasViewModel => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const route = useRoute();
  const pageName = sourceScreenName ?? route.name;

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAnyAccounts;

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;

  const { openDrawer: openTransferDrawer } = useTransferDrawerController();

  const handleTransferPress = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "transfer",
      page: pageName,
    });
    openTransferDrawer({ sourceScreenName: pageName });
  }, [openTransferDrawer, pageName]);

  const handleSwapPress = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "swap",
      page: pageName,
    });
    navigation.navigate(NavigatorName.Swap);
  }, [navigation, pageName]);

  const handleBuyPress = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "buy",
      page: pageName,
    });
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
    });
  }, [navigation, pageName]);

  const quickActions: readonly QuickActionCta[] = useMemo(
    () => [
      {
        id: "transfer",
        label: t("portfolio.quickActionsCtas.transfer"),
        icon: TransferVertical,
        disabled: readOnlyModeEnabled,
        onPress: handleTransferPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.transfer,
      },
      {
        id: "swap",
        label: t("portfolio.quickActionsCtas.swap"),
        icon: Exchange,
        disabled: !isExchangeEnabled || readOnlyModeEnabled || !hasFunds,
        onPress: handleSwapPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.swap,
      },
      {
        id: "buy",
        label: t("portfolio.quickActionsCtas.buy"),
        icon: Plus,
        disabled: !isExchangeEnabled || readOnlyModeEnabled,
        onPress: handleBuyPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.buy,
      },
    ],
    [
      t,
      readOnlyModeEnabled,
      hasFunds,
      isExchangeEnabled,
      handleTransferPress,
      handleSwapPress,
      handleBuyPress,
    ],
  );

  return {
    quickActions,
  };
};
