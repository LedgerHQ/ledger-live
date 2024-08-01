import React, { useCallback, useState } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  useWalletSyncAnalytics,
  AnalyticsPage,
  AnalyticsButton,
} from "LLM/features/WalletSync/hooks/useWalletSyncAnalytics";
import { useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/trustchain/store";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";

const WalletSyncRow = () => {
  const { t } = useTranslation();
  const { onClickTrack } = useWalletSyncAnalytics();
  const navigation = useNavigation();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const closeDrawer = useCallback(() => {
    setIsDrawerVisible(false);
  }, []);
  const trustchain = useSelector(trustchainSelector);

  const navigateToWalletSyncActivationScreen = useCallback(() => {
    // Here we need to check if the user has a backup or not to determine the screen to navigate to
    onClickTrack({ button: AnalyticsButton.LedgerSync, page: AnalyticsPage.SettingsGeneral });

    if (trustchain?.rootId) {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncActivated,
      });
    } else {
      setIsDrawerVisible(true);
    }
  }, [navigation, onClickTrack, trustchain?.rootId]);

  return (
    <>
      <SettingsRow
        event="WalletSyncSettingsRow"
        title={t("settings.display.walletSync")}
        desc={t("settings.display.walletSyncDesc")}
        arrowRight
        onPress={navigateToWalletSyncActivationScreen}
        testID="wallet-sync-button"
      />
      {isDrawerVisible && (
        <ActivationDrawer
          startingStep={Steps.Activation}
          isOpen={isDrawerVisible}
          handleClose={closeDrawer}
        />
      )}
    </>
  );
};

export default WalletSyncRow;
