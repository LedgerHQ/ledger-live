import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { walletSyncFakedSelector } from "~/renderer/reducers/walletSync";
import Button from "~/renderer/components/Button";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

type WalletSyncRowProps = {
  variant?: "manage" | "sync";
};

const WalletSyncRow = ({ variant = "manage" }: WalletSyncRowProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { goToWelcomeScreenWalletSync } = useFlows();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const { openDrawer: openActivationDrawer } = useActivationDrawer();
  const { onClickTrack } = useLedgerSyncAnalytics();

  const handleManageClick = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
      onClickTrack({ button: "Manage Ledger Sync", page: AnalyticsPage.SettingsGeneral });
    }
    dispatch(setDrawerVisibility(true));
  };

  const handleSyncClick = () => {
    onClickTrack({ button: "Sync my wallet", page: AnalyticsPage.SettingsGeneral });
    openActivationDrawer();
  };

  if (variant === "sync") {
    return (
      <Button small event="Sync WalletSync" primary onClick={handleSyncClick}>
        {t("walletSync.banner.cta")}
      </Button>
    );
  }

  if (variant === "manage") {
    return (
      <Button small event="Manage WalletSync" primary onClick={handleManageClick}>
        {t("walletSync.manage.cta")}
      </Button>
    );
  }

  return null;
};

export default WalletSyncRow;
