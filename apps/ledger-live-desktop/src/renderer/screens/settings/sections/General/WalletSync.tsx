import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

const WalletSyncRow = () => {
  const { goToWelcomeScreenWalletSync } = useFlows();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const { onClickTrack } = useLedgerSyncAnalytics();

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
      onClickTrack({ button: "Manage Ledger Sync", page: AnalyticsPage.SettingsGeneral });
    }
    dispatch(setDrawerVisibility(true));
  };

  return (
    <Button small event="Manage WalletSync" primary onClick={openDrawer}>
      {t("walletSync.manage.cta")}
    </Button>
  );
};

export default WalletSyncRow;
