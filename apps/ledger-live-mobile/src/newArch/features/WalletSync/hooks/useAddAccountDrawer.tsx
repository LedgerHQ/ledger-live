import { useSelector } from "react-redux";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { useCallback, useState } from "react";
import { track } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type AddAccountDrawerProps = {
  isOpened: boolean;
  onClose: () => void;
  reopenDrawer: () => void;
};

const useAddAccountDrawer = ({ isOpened, onClose, reopenDrawer }: AddAccountDrawerProps) => {
  const navigation = useNavigation<BaseNavigation>();
  const walletSyncFeatureFlag = useFeature("llmWalletSync");

  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const isWalletSyncEnabled = walletSyncFeatureFlag?.enabled;

  const [isWalletSyncDrawerVisible, setWalletSyncDrawerVisible] = useState(false);

  const trackButtonClick = useCallback((button: string) => {
    track("button_clicked", {
      button,
      drawer: "AddAccountsModal",
    });
  }, []);

  const onClickImport = useCallback(() => {
    trackButtonClick("Import from Desktop");
    onClose();
    navigation.navigate(NavigatorName.ImportAccounts);
  }, [trackButtonClick, navigation, onClose]);

  const onClickAdd = useCallback(() => {
    trackButtonClick("With your Ledger");
    onClose();
    navigation.navigate(NavigatorName.AddAccounts);
  }, [trackButtonClick, navigation, onClose]);

  const onClickWalletSync = useCallback(() => {
    trackButtonClick("With Wallet Sync");
    onClose();
    setWalletSyncDrawerVisible(true);
  }, [trackButtonClick, onClose]);

  const onCloseAddAccountDrawer = useCallback(() => {
    trackButtonClick("Close 'x'");
    onClose();
  }, [trackButtonClick, onClose]);

  const onCloseWalletSyncDrawer = useCallback(() => {
    setWalletSyncDrawerVisible(false);
    reopenDrawer();
  }, [setWalletSyncDrawerVisible, reopenDrawer]);

  return {
    isWalletSyncEnabled,
    isReadOnlyModeEnabled,
    isAddAccountDrawerVisible: isOpened,
    isWalletSyncDrawerVisible,
    onClickAdd,
    onClickImport,
    onClickWalletSync,
    onCloseAddAccountDrawer,
    onCloseWalletSyncDrawer,
  };
};

export default useAddAccountDrawer;
