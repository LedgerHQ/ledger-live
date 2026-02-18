import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { QrCode, ArrowUp, Bank } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsCountSelector, areAccountsEmptySelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { TransferAction } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import { useReceiveNoahEntry } from "LLM/features/Noah/useNoahEntryPoint";

// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

const BUTTON_ID = "quick_action_transfer";

interface TransferDrawerViewModel {
  isOpen: boolean;
  actions: readonly TransferAction[];
  handleClose: () => void;
  t: (key: string) => string;
}

export const useTransferDrawerViewModel = (): TransferDrawerViewModel => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const { isOpen, sourceScreenName, closeDrawer } = useTransferDrawerController();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasFunds = !useSelector(areAccountsEmptySelector) && hasAnyAccounts;

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName,
    fromMenu: true,
  });

  const { showNoahMenu: showNoahOption } = useReceiveNoahEntry();

  const handleReceivePress = useCallback(() => {
    track("button_clicked", {
      button: BUTTON_ID,
      flow: "receive",
      page: sourceScreenName,
    });
    closeDrawer();
    handleOpenReceiveDrawer();
  }, [closeDrawer, handleOpenReceiveDrawer, sourceScreenName]);

  const handleSendPress = useCallback(() => {
    track("button_clicked", {
      button: BUTTON_ID,
      flow: "send",
      page: sourceScreenName,
    });
    closeDrawer();
    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
    });
  }, [closeDrawer, navigation, sourceScreenName]);

  const handleBankTransferPress = useCallback(() => {
    track("button_clicked", {
      button: BUTTON_ID,
      flow: "bank_transfer",
      page: sourceScreenName,
    });
    closeDrawer();
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveProvider,
      params: {
        manifestId: FIAT_PROVIDER_MANIFEST_ID,
      },
    });
  }, [closeDrawer, navigation, sourceScreenName]);

  const actions: readonly TransferAction[] = useMemo(
    () => [
      {
        id: "receive",
        title: t("portfolio.quickActionsCtas.transferDrawer.receiveCrypto"),
        icon: QrCode,
        disabled: readOnlyModeEnabled,
        onPress: handleReceivePress,
        testID: QUICK_ACTIONS_TEST_IDS.transferDrawer.receive,
      },
      {
        id: "send",
        title: t("portfolio.quickActionsCtas.transferDrawer.sendCrypto"),
        icon: ArrowUp,
        disabled: readOnlyModeEnabled || !hasFunds,
        onPress: handleSendPress,
        testID: QUICK_ACTIONS_TEST_IDS.transferDrawer.send,
      },
      ...(showNoahOption
        ? [
            {
              id: "bank_transfer" as const,
              title: t("portfolio.quickActionsCtas.transferDrawer.bankTransfer"),
              description: t("portfolio.quickActionsCtas.transferDrawer.bankTransferDescription"),
              icon: Bank,
              disabled: readOnlyModeEnabled,
              onPress: handleBankTransferPress,
              testID: QUICK_ACTIONS_TEST_IDS.transferDrawer.bankTransfer,
            },
          ]
        : []),
    ],
    [
      t,
      readOnlyModeEnabled,
      handleReceivePress,
      hasFunds,
      handleSendPress,
      showNoahOption,
      handleBankTransferPress,
    ],
  );

  return {
    isOpen,
    actions,
    handleClose: closeDrawer,
    t,
  };
};
