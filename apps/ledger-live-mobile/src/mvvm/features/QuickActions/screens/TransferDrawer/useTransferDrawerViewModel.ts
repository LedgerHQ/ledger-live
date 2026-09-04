import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useSelector } from "~/context/hooks";
import { QrCode, ArrowUp, Bank } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { languageSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { accountsCountSelector, useAreAccountsEmpty } from "~/reducers/accounts";
import { useFeature } from "@features/platform-feature-flags";
import { resolveRemoteCopy } from "@ledgerhq/live-common/analytics/remoteABTesting/resolveRemoteCopy";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/index";
import { track } from "~/analytics";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { TransferAction } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import { useReceiveNoahEntry } from "LLM/features/Noah/useNoahEntryPoint";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

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
  ledgerIds?: string[];
}

export const useTransferDrawerViewModel = ({
  currency,
  ledgerIds,
}: UseTransferDrawerViewModelParams = {}): TransferDrawerViewModel => {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const { isOpen, sourceScreenName, closeDrawer } = useTransferDrawerController();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const hasFunds = !useAreAccountsEmpty() && hasAnyAccounts;

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    sourceScreenName,
    fromMenu: true,
    currencyIds: ledgerIds,
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

  const { isEnabled: isNewSendFlowEnabled, isEnabledForFamily } = useNewSendFlowFeature();
  const { handleOpenSendFlow } = useOpenSendFlow({
    currency,
    currencyIds: ledgerIds,
    sourceScreenName,
  });

  // The flag also filters on family / excluded currency, so a globally enabled
  // flag does not mean the asset at hand actually lands in the new send flow.
  const assetCurrencyId =
    currency?.type === "TokenCurrency" ? currency.parentCurrencyId : currency?.id;
  const assetFamily = useMemo(
    () => (assetCurrencyId ? getFamilyByCurrencyId(assetCurrencyId) : undefined),
    [assetCurrencyId],
  );
  const canOpenNewSendFlowFromEntry = Boolean(currency || ledgerIds?.length);
  const isNewSendFlowEnabledForAsset =
    canOpenNewSendFlowFromEntry && isEnabledForFamily(assetFamily, assetCurrencyId);

  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(null, null, isNewSendFlowEnabledForAsset);
  }, [isNewSendFlowEnabledForAsset]);

  const handleSendPress = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "send",
      buttonLocation: BUTTON_LOCATION,
      page: sourceScreenName,
    });
    closeDrawer();
    if (isNewSendFlowEnabled && canOpenNewSendFlowFromEntry) {
      handleOpenSendFlow();
      return;
    }
    // When opened from an asset, filter the account list to that asset.
    // `currencyIds` covers every network of a multi-network asset (e.g. USDT on
    // Ethereum + Tron), which a single `selectedCurrency` cannot. Without a
    // currency (generic transfer entry) we keep the unfiltered list.
    if (currency) {
      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendCoin,
        params: { selectedCurrency: currency, currencyIds: ledgerIds },
      });
    } else {
      navigation.navigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendCoin,
      });
    }
  }, [
    canOpenNewSendFlowFromEntry,
    closeDrawer,
    currency,
    handleOpenSendFlow,
    isNewSendFlowEnabled,
    ledgerIds,
    navigation,
    sourceScreenName,
    trackingProperties,
  ]);

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
