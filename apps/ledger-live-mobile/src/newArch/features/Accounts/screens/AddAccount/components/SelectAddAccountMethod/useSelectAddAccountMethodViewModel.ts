import { useSelector } from "react-redux";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { useCallback, useMemo } from "react";
import { track } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AddAccountContexts } from "../../enums";
import {
  useModularDrawerController,
  useModularDrawerVisibility,
  ModularDrawerLocation,
} from "LLM/features/ModularDrawer";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";

const currencies = listAndFilterCurrencies({ includeTokens: true });

type AddAccountMethodViewModelProps = {
  currency?: CryptoCurrency | TokenCurrency | null;
  onShowWalletSyncDrawer?: () => void;
  onCloseAddAccountDrawer?: () => void;
};

const useSelectAddAccountMethodViewModel = ({
  currency,
  onShowWalletSyncDrawer,
  onCloseAddAccountDrawer,
}: AddAccountMethodViewModelProps) => {
  const navigation = useNavigation<BaseNavigation>();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });
  const walletSyncFeatureFlag = useFeature("llmWalletSync");
  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;
  const route = useRoute();
  const hasCurrency = !!currency;

  const navigationParams = useMemo(() => {
    if (hasCurrency) {
      if (currency?.type === "TokenCurrency") {
        return {
          token: currency,

          context: AddAccountContexts.AddAccounts,
        };
      } else {
        return {
          currency,

          context: AddAccountContexts.AddAccounts,
        };
      }
    } else {
      return { context: AddAccountContexts.AddAccounts, sourceScreenName: route.name };
    }
  }, [hasCurrency, currency, route.name]);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const handleWalletSync = useCallback(() => {
    trackButtonClick("Account Use Ledger Sync");
    onShowWalletSyncDrawer?.();
  }, [trackButtonClick, onShowWalletSyncDrawer]);

  const { openDrawer } = useModularDrawerController();

  const handleOpenModularDrawer = useCallback(() => {
    const currenciesToUse = currency ? [currency] : currencies;
    return openDrawer({
      currencies: currenciesToUse,
      enableAccountSelection: false,
      flow: "add_account",
      source: "add_account_button",
    });
  }, [currency, openDrawer]);

  const handleAddAccount = useCallback(() => {
    trackButtonClick("With your Ledger");

    onCloseAddAccountDrawer?.();

    if (isModularDrawerVisible({ location: ModularDrawerLocation.ADD_ACCOUNT })) {
      handleOpenModularDrawer();
    } else {
      const entryNavigatorName = NavigatorName.AssetSelection;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      navigation.navigate(entryNavigatorName, navigationParams);
    }
  }, [
    trackButtonClick,
    onCloseAddAccountDrawer,
    isModularDrawerVisible,
    handleOpenModularDrawer,
    navigation,
    navigationParams,
  ]);

  return {
    isWalletSyncEnabled,
    isReadOnlyModeEnabled,
    handleAddAccount,
    handleWalletSync,
  };
};

export default useSelectAddAccountMethodViewModel;
