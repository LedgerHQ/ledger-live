import React, { useCallback } from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
  AnalyticsButton,
} from "LLM/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { useDispatch, useSelector } from "react-redux";
import { trustchainSelector } from "@ledgerhq/trustchain/store";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { activateDrawerSelector } from "~/reducers/walletSync";
import { setLedgerSyncActivateDrawer } from "~/actions/walletSync";
import { useCurrentStep } from "LLM/features/WalletSync/hooks/useCurrentStep";

const WalletSyncRow = () => {
  const { t } = useTranslation();
  const { onClickTrack } = useLedgerSyncAnalytics();
  const navigation = useNavigation();

  const isDrawerVisible = useSelector(activateDrawerSelector);
  const dispatch = useDispatch();
  const { setCurrentStep } = useCurrentStep();

  const closeDrawer = useCallback(() => {
    dispatch(setLedgerSyncActivateDrawer(false));
    setCurrentStep(Steps.Activation);
  }, [dispatch, setCurrentStep]);
  const trustchain = useSelector(trustchainSelector);

  const navigateToWalletSyncActivationScreen = useCallback(() => {
    // Here we need to check if the user has a backup or not to determine the screen to navigate to
    onClickTrack({ button: AnalyticsButton.LedgerSync, page: AnalyticsPage.SettingsGeneral });

    if (trustchain?.rootId) {
      navigation.navigate(NavigatorName.WalletSync, {
        screen: ScreenName.WalletSyncActivated,
      });
    } else {
      dispatch(setLedgerSyncActivateDrawer(true));
    }
  }, [navigation, onClickTrack, trustchain?.rootId, dispatch]);

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

      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isDrawerVisible}
        handleClose={closeDrawer}
      />
    </>
  );
};

export default WalletSyncRow;
