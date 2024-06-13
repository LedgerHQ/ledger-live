import { useSelector } from "react-redux";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { useCallback, useMemo, useState } from "react";
import { track } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type AddAccountScreenProps = {
  currency?: CryptoCurrency | TokenCurrency | null;
  onClose?: () => void;
};

const useSelectAddAccountMethodViewModel = ({ currency, onClose }: AddAccountScreenProps) => {
  const navigation = useNavigation<BaseNavigation>();
  const walletSyncFeatureFlag = useFeature("llmWalletSync");

  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;
  const hasCurrency = !!currency;

  const [isWalletSyncDrawerVisible, setWalletSyncDrawerVisible] = useState(false);

  const navigationParams = useMemo(() => {
    return hasCurrency
      ? currency.type === "TokenCurrency"
        ? { token: currency }
        : { currency }
      : {};
  }, [hasCurrency, currency]);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onClickImport = useCallback(() => {
    trackButtonClick("Import from Desktop");
    onClose?.();
    navigation.navigate(NavigatorName.ImportAccounts);
  }, [navigation, trackButtonClick, onClose]);

  const onClickAdd = useCallback(() => {
    trackButtonClick("With your Ledger");
    onClose?.();
    navigation.navigate(NavigatorName.AddAccounts, navigationParams);
  }, [navigation, navigationParams, trackButtonClick, onClose]);

  const onClickWalletSync = useCallback(() => {
    trackButtonClick("With Wallet Sync");
    onClose?.();
    setWalletSyncDrawerVisible(true);
  }, [trackButtonClick, setWalletSyncDrawerVisible, onClose]);

  const onCloseWalletSyncDrawer = useCallback(() => {
    setWalletSyncDrawerVisible(false);
  }, [setWalletSyncDrawerVisible]);

  return {
    isWalletSyncEnabled,
    isReadOnlyModeEnabled,
    isWalletSyncDrawerVisible,
    onClickAdd,
    onClickImport,
    onClickWalletSync,
    onCloseWalletSyncDrawer,
  };
};

export default useSelectAddAccountMethodViewModel;
