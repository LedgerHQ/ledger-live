import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "~/context/hooks";
import { QrCode, ArrowUp, Bank } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { languageSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsCountSelector, useAreAccountsEmpty } from "~/reducers/accounts";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { resolveRemoteCopy } from "@ledgerhq/live-common/featureFlags/remoteABTesting/resolveRemoteCopy";
import { track } from "~/analytics";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { TransferAction } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import { useReceiveNoahEntry } from "LLM/features/Noah/useNoahEntryPoint";
// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

const BUTTON_LOCATION = "quick_action_transfer";

interface TransferDrawerViewModel {
  isOpen: boolean;
  title: string;
  actions: readonly TransferAction[];
  handleClose: () => void;
  bottomInset: number;
}

interface UseTransferDrawerViewModelParams {
  currency?: CryptoOrTokenCurrency;
}

export const useTransferDrawerViewModel = ({
  currency,
}: UseTransferDrawerViewModelParams = {}): TransferDrawerViewModel => {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const { isOpen, sourceScreenName, closeDrawer } = useTransferDrawerController();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasFunds = !useAreAccountsEmpty() && hasAnyAccounts;

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName,
    fromMenu: true,
  });

  const { showNoahMenu: showNoahOption } = useReceiveNoahEntry({ currency });

  const transferCopyFlag = useFeature("llmTransferButtonCopyVariant");
  const language = useSelector(languageSelector);
  const isEN = language === "en";
  const flagParams = transferCopyFlag?.params;
  const resolveCopy = useCallback(
    (param: string | undefined, fallback: string) =>
      resolveRemoteCopy(transferCopyFlag?.enabled, isEN, param, fallback),
    [transferCopyFlag?.enabled, isEN],
  );

  const title = resolveCopy(
    flagParams?.modalTitle,
    t("portfolio.quickActionsCtas.transferDrawer.title"),
  );

  const handleReceivePress = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      buttonLocation: BUTTON_LOCATION,
      page: sourceScreenName,
    });
    closeDrawer();
    handleOpenReceiveDrawer();
  }, [closeDrawer, handleOpenReceiveDrawer, sourceScreenName]);

  const handleSendPress = useCallback(() => {
    track("button_clicked", {
      button: "send",
      buttonLocation: BUTTON_LOCATION,
      page: sourceScreenName,
    });
    closeDrawer();
    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendCoin,
    });
  }, [closeDrawer, navigation, sourceScreenName]);

  const handleBankTransferPress = useCallback(() => {
    track("button_clicked", {
      button: "bank_transfer",
      buttonLocation: BUTTON_LOCATION,
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
        title: resolveCopy(
          flagParams?.rowReceiveTitle,
          t("portfolio.quickActionsCtas.transferDrawer.receiveCrypto"),
        ),
        icon: QrCode,
        disabled: readOnlyModeEnabled,
        onPress: handleReceivePress,
        testID: QUICK_ACTIONS_TEST_IDS.transferDrawer.receive,
      },
      {
        id: "send",
        title: resolveCopy(
          flagParams?.rowSendTitle,
          t("portfolio.quickActionsCtas.transferDrawer.sendCrypto"),
        ),
        icon: ArrowUp,
        disabled: readOnlyModeEnabled || !hasFunds,
        onPress: handleSendPress,
        testID: QUICK_ACTIONS_TEST_IDS.transferDrawer.send,
      },
      ...(showNoahOption
        ? [
            {
              id: "bank_transfer" as const,
              title: resolveCopy(
                flagParams?.rowCashToStableTitle,
                t("portfolio.quickActionsCtas.transferDrawer.bankTransfer"),
              ),
              description: resolveCopy(
                flagParams?.rowCashToStableDescription,
                t("portfolio.quickActionsCtas.transferDrawer.bankTransferDescription"),
              ),
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
      flagParams,
      resolveCopy,
    ],
  );

  return {
    isOpen,
    title,
    actions,
    handleClose: closeDrawer,
    bottomInset,
  };
};
