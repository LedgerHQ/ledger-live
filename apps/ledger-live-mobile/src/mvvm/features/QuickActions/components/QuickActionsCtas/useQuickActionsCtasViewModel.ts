import { useCallback, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import {
  TransferVertical,
  Exchange,
  Plus,
  LedgerLogo,
  Cart,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsCountSelector, areAccountsEmptySelector } from "~/reducers/accounts";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { track } from "~/analytics";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { QuickActionCta, UserQuickActionsState } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";

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
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const route = useRoute();
  const pageName = sourceScreenName ?? route.name;

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAnyAccounts;

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;

  const { openDrawer: openTransferDrawer } = useTransferDrawerController();
  const { navigateToRebornFlow } = useRebornFlow();

  // Determine user state
  const userState: UserQuickActionsState = useMemo(() => {
    if (readOnlyModeEnabled) {
      return "no_signer";
    }
    if (!hasFunds) {
      return "no_funds";
    }
    return "has_funds";
  }, [readOnlyModeEnabled, hasFunds]);

  // Handlers for standard CTAs (Transfer, Swap, Buy)
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

  // Handlers for no-signer CTAs (Connect, Buy a Ledger)
  const handleConnectPress = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "connect",
      page: pageName,
    });
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: {
          userHasDevice: true,
        },
      },
    });
  }, [navigation, pageName]);

  const handleBuyLedgerPress = useCallback(() => {
    track("button_clicked", {
      button: "quick_action",
      flow: "buy_ledger",
      page: pageName,
    });
    navigateToRebornFlow();
  }, [navigateToRebornFlow, pageName]);

  // CTAs for no-signer state
  const noSignerActions: readonly QuickActionCta[] = useMemo(
    () => [
      {
        id: "connect",
        label: t("portfolio.quickActionsCtas.connect"),
        icon: LedgerLogo,
        disabled: false,
        onPress: handleConnectPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.connect,
      },
      {
        id: "buy_ledger",
        label: t("portfolio.quickActionsCtas.buyLedger"),
        icon: Cart,
        disabled: false,
        onPress: handleBuyLedgerPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.buyLedger,
      },
    ],
    [t, handleConnectPress, handleBuyLedgerPress],
  );

  // CTAs for no-funds and has-funds states
  const standardActions: readonly QuickActionCta[] = useMemo(
    () => [
      {
        id: "transfer",
        label: t("portfolio.quickActionsCtas.transfer"),
        icon: TransferVertical,
        disabled: false,
        onPress: handleTransferPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.transfer,
      },
      {
        id: "swap",
        label: t("portfolio.quickActionsCtas.swap"),
        icon: Exchange,
        disabled: !isExchangeEnabled || !hasFunds,
        onPress: handleSwapPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.swap,
      },
      {
        id: "buy",
        label: t("portfolio.quickActionsCtas.buy"),
        icon: Plus,
        disabled: !isExchangeEnabled,
        onPress: handleBuyPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.buy,
      },
    ],
    [t, hasFunds, isExchangeEnabled, handleTransferPress, handleSwapPress, handleBuyPress],
  );

  const quickActions = userState === "no_signer" ? noSignerActions : standardActions;

  return {
    quickActions,
  };
};
