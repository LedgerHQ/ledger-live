import { track } from "@shared/analytics";
import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { QrCode, ArrowUp, Bank } from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  blacklistedTokenIdsSelector,
  languageSelector,
  readOnlyModeEnabledSelector,
} from "~/reducers/settings";
import { accountsCountSelector, accountSelector, useAreAccountsEmpty } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import type { TransferDrawerScope } from "~/reducers/transferDrawer";
import { useFeature } from "@features/platform-feature-flags";
import { resolveRemoteCopy } from "@ledgerhq/live-common/analytics/remoteABTesting/resolveRemoteCopy";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/index";
import { canReceive, isSendDisabledForFamily } from "@ledgerhq/live-common/account/index";
import { useTransferDrawerController } from "../../hooks/useTransferDrawerController";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { hasAnyFunds, listHeldAssets } from "@features/platform-quick-actions";
import type { AccountAsset } from "LLM/utils/accountAssets";
import {
  useAccountAssetPicker,
  type AccountAssetPickerSheetProps,
} from "LLM/components/AccountAssetPickerSheet/useAccountAssetPicker";
import { TransferAction } from "../../types";
import { QUICK_ACTIONS_TEST_IDS } from "../../testIds";
import { useTranslation } from "~/context/Locale";
import { useReceiveNoahEntry } from "LLM/features/Noah/useNoahEntryPoint";
import { useNewSendFlowFeature } from "LLM/features/Send/hooks/useNewSendFlowFeature";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { getSendFlowTrackingProperties } from "LLM/features/Send/utils/tracking";

// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

const BUTTON_LOCATION = "quick_action_transfer";

interface TransferDrawerViewModel {
  isOpen: boolean;
  title: string;
  actions: readonly TransferAction[];
  handleClose: () => void;
  bottomInset: number;
  assetPicker: AccountAssetPickerSheetProps;
}

function listSendableAssets(
  account: Account,
  blacklistedTokenIds: readonly string[],
): readonly AccountAsset[] {
  if (isSendDisabledForFamily(account.currency.family)) return [];
  return listHeldAssets(account, new Set(blacklistedTokenIds));
}

function selectScopedAccount(state: State, scope: TransferDrawerScope): Account | undefined {
  if (scope.type !== "account") return undefined;
  return accountSelector(state, { accountId: scope.accountId });
}

export const useTransferDrawerViewModel = (): TransferDrawerViewModel => {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();

  const { isOpen, sourceScreenName, scope, closeDrawer } = useTransferDrawerController();
  const account = useSelector(state => selectScopedAccount(state, scope));
  const currency = scope.type === "asset" ? scope.currency : account?.currency;
  const ledgerIds = scope.type === "asset" ? scope.ledgerIds : undefined;

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasAnyAccounts = useSelector(accountsCountSelector) > 0;
  const walletHasFunds = !useAreAccountsEmpty() && hasAnyAccounts;
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const sendableAssets = useMemo(
    () => (account ? listSendableAssets(account, blacklistedTokenIds) : []),
    [account, blacklistedTokenIds],
  );
  const hasFunds = scope.type === "account" ? hasAnyFunds(sendableAssets) : walletHasFunds;
  const isReceiveSupported = !account || canReceive(account, undefined);

  const { handleOpenReceiveDrawer, openReceiveForAccount } = useOpenReceiveDrawer({
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
    if (account) {
      if (isReceiveSupported) openReceiveForAccount(account);
      return;
    }
    handleOpenReceiveDrawer();
  }, [
    account,
    closeDrawer,
    handleOpenReceiveDrawer,
    isReceiveSupported,
    openReceiveForAccount,
    sourceScreenName,
  ]);

  const { isEnabledForFamily } = useNewSendFlowFeature();
  const { handleOpenSendFlow, openSendFlowForAccount } = useOpenSendFlow({
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
  const shouldOpenNewSendFlow = isEnabledForFamily(assetFamily, assetCurrencyId);

  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(null, null, shouldOpenNewSendFlow);
  }, [shouldOpenNewSendFlow]);

  const { pickAsset, sheetProps: assetPicker } = useAccountAssetPicker();
  const sendFromAccountAsset = useCallback(() => {
    pickAsset(sendableAssets, ({ account: assetAccount, parentAccount }) =>
      openSendFlowForAccount(assetAccount, parentAccount),
    );
  }, [openSendFlowForAccount, pickAsset, sendableAssets]);

  const handleSendPress = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "send",
      buttonLocation: BUTTON_LOCATION,
      page: sourceScreenName,
    });
    closeDrawer();
    if (account) {
      sendFromAccountAsset();
      return;
    }
    if (shouldOpenNewSendFlow) {
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
    account,
    closeDrawer,
    currency,
    handleOpenSendFlow,
    sendFromAccountAsset,
    ledgerIds,
    navigation,
    shouldOpenNewSendFlow,
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
        disabled: readOnlyModeEnabled || !isReceiveSupported,
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
      isReceiveSupported,
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
    assetPicker,
  };
};
