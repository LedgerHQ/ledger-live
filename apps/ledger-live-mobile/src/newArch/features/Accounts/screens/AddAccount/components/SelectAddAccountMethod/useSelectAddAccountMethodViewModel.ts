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

type AddAccountScreenProps = {
  currency?: CryptoCurrency | TokenCurrency | null;
  onClose?: () => void;
  setWalletSyncDrawerVisible?: () => void;
};

const useSelectAddAccountMethodViewModel = ({
  currency,
  onClose,
  setWalletSyncDrawerVisible,
}: AddAccountScreenProps) => {
  const navigation = useNavigation<BaseNavigation>();
  const walletSyncFeatureFlag = useFeature("llmWalletSync");
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;
  const route = useRoute();
  const hasCurrency = !!currency;

  const navigationParams = useMemo(() => {
    if (hasCurrency) {
      if (currency?.type === "TokenCurrency") {
        return {
          token: currency,
          ...(llmNetworkBasedAddAccountFlow?.enabled && {
            context: AddAccountContexts.AddAccounts,
          }),
        };
      } else {
        return {
          currency,
          ...(llmNetworkBasedAddAccountFlow?.enabled && {
            context: AddAccountContexts.AddAccounts,
          }),
        };
      }
    } else {
      return llmNetworkBasedAddAccountFlow?.enabled
        ? { context: AddAccountContexts.AddAccounts, sourceScreenName: route.name }
        : {};
    }
  }, [hasCurrency, currency, llmNetworkBasedAddAccountFlow?.enabled, route.name]);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onClickImport = useCallback(() => {
    trackButtonClick("Import via another Ledger Live app");
    onClose?.();
    navigation.navigate(NavigatorName.ImportAccounts);
  }, [navigation, trackButtonClick, onClose]);

  const onClickImportLedgerSync = useCallback(() => {
    trackButtonClick("Account Use Ledger Sync");
    setWalletSyncDrawerVisible?.();
  }, [trackButtonClick, setWalletSyncDrawerVisible]);

  const onClickAdd = useCallback(() => {
    trackButtonClick("With your Ledger");
    onClose?.();
    const EntryNavigatorName = llmNetworkBasedAddAccountFlow?.enabled
      ? NavigatorName.AssetSelection
      : NavigatorName.AddAccounts;
    // to delete after llmNetworkBasedAddAccountFlow is fully enabled (ts inference not working well based on navigationParams)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    navigation.navigate(EntryNavigatorName, navigationParams);
  }, [
    navigation,
    navigationParams,
    trackButtonClick,
    onClose,
    llmNetworkBasedAddAccountFlow?.enabled,
  ]);

  return {
    isWalletSyncEnabled,
    isReadOnlyModeEnabled,
    onClickAdd,
    onClickImport,
    onClickImportLedgerSync,
  };
};

export default useSelectAddAccountMethodViewModel;
