import React, { useState } from "react";
import { useSelector } from "react-redux";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { walletSyncSelector } from "~/renderer/reducers/walletSync";
import WalletSyncActivation from "./SideContent/Activation";
import WalletSyncManage from "./SideContent/Manage";

const WalletSyncRow = () => {
  const walletSync = useSelector(walletSyncSelector);
  const [open, setOpen] = useState(false);

  return (
    <>
      <SideDrawer isOpen={open} onRequestClose={() => setOpen(false)} direction="left">
        {walletSync.activated ? <WalletSyncManage /> : <WalletSyncActivation />}
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        Manage
      </Button>
    </>
  );
};
export default WalletSyncRow;
