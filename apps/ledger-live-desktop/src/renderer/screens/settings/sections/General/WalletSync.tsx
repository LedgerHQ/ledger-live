import React, { useState } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTranslation } from "react-i18next";
import { WalletSyncRouter } from "LLD/WalletSync/SideContent/router";

const WalletSyncRow = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <SideDrawer isOpen={open} onRequestClose={() => setOpen(false)} direction="left">
        <WalletSyncRouter />
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        {t("walletSync.manage.cta")}
      </Button>
    </>
  );
};
export default WalletSyncRow;
