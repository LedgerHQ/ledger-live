import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import React, { useState } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";

const SideContentActivateWalletSync = () => {
  return <div>Activate Wallet Sync</div>;
};

const SideContentWalletSync = () => {
  return <div>Wallet Sync</div>;
};

const WalletSyncRow = () => {
  const lldWalletSync = useFeature("lldWalletSync");

  const [open, setOpen] = useState(false);

  return (
    <>
      <SideDrawer isOpen={open} onRequestClose={() => setOpen(false)} direction="left">
        {lldWalletSync?.enabled ? <SideContentWalletSync /> : <SideContentActivateWalletSync />}
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        Manage
      </Button>
    </>
  );
};
export default WalletSyncRow;
