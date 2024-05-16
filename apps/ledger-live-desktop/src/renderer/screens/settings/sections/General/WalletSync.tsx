import React, { useState } from "react";
import { useSelector } from "react-redux";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { walletSyncSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "LLD/WalletSync/SideContent/Activation";
import WalletSyncManage from "LLD/WalletSync/SideContent/Manage";
import { useTranslation } from "react-i18next";

const WalletSyncRow = () => {
  const walletSync = useSelector(walletSyncSelector);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <SideDrawer isOpen={open} onRequestClose={() => setOpen(false)} direction="left">
        {!walletSync.activated ? <WalletSyncManage /> : <WalletSyncActivation />}
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        {t("walletSync.manage.cta")}
      </Button>
    </>
  );
};
export default WalletSyncRow;
