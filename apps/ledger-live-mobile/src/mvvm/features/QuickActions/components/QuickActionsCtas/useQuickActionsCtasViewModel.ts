import { track } from "@shared/analytics";
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
import { languageSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useFeature } from "@features/platform-feature-flags";
import { resolveRemoteCopy } from "@ledgerhq/live-common/analytics/remoteABTesting/resolveRemoteCopy";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { QuickActionCta } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import useBuyDeviceAction from "LLM/features/Reborn/hooks/useBuyDeviceAction";
import { useOpenSwap } from "LLM/features/Swap";

const BUTTON_LOCATION = "quick_action";

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

  const ptxServiceCtaExchangeDrawer = useFeature("ptxServiceCtaExchangeDrawer");
  const isExchangeEnabled = ptxServiceCtaExchangeDrawer?.enabled ?? true;

  const transferCopyFlag = useFeature("llmTransferButtonCopyVariant");
  const language = useSelector(languageSelector);
  const isEN = language === "en";

  const { openDrawer: openTransferDrawer } = useTransferDrawerController();
  const handleBuyDeviceAction = useBuyDeviceAction();
  const { handleOpenSwap } = useOpenSwap({ sourceScreenName: pageName });

  const trackPress = useCallback(
    (button: string) => {
      track("button_clicked", {
        button,
        buttonLocation: BUTTON_LOCATION,
        page: pageName,
      });
    },
    [pageName],
  );

  const handleTransferPress = useCallback(() => {
    trackPress("transfer");
    openTransferDrawer({ sourceScreenName: pageName });
  }, [trackPress, openTransferDrawer, pageName]);

  const handleSwapPress = useCallback(() => {
    trackPress("swap");
    handleOpenSwap();
  }, [trackPress, handleOpenSwap]);

  const handleBuyPress = useCallback(() => {
    trackPress("buy");
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
    });
  }, [trackPress, navigation]);

  const handleConnectPress = useCallback(() => {
    trackPress("connect");
    navigation.navigate(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: { userHasDevice: true },
      },
    });
  }, [trackPress, navigation]);

  const handleBuyLedgerPress = useCallback(() => {
    trackPress("buy_ledger");
    handleBuyDeviceAction();
  }, [trackPress, handleBuyDeviceAction]);

  // no signer: Connect + Buy Ledger
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

  // standard: Transfer + Swap + Buy
  const standardActions: readonly QuickActionCta[] = useMemo(
    () => [
      {
        id: "transfer",
        label: resolveRemoteCopy(
          transferCopyFlag?.enabled,
          isEN,
          transferCopyFlag?.params?.buttonLabel,
          t("portfolio.quickActionsCtas.transfer"),
        ),
        icon: TransferVertical,
        disabled: false,
        onPress: handleTransferPress,
        testID: QUICK_ACTIONS_TEST_IDS.ctas.transfer,
      },
      {
        id: "swap",
        label: t("portfolio.quickActionsCtas.swap"),
        icon: Exchange,
        disabled: !isExchangeEnabled,
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
    [
      t,
      isEN,
      transferCopyFlag,
      isExchangeEnabled,
      handleTransferPress,
      handleSwapPress,
      handleBuyPress,
    ],
  );

  const quickActions = readOnlyModeEnabled ? noSignerActions : standardActions;

  return { quickActions };
};
