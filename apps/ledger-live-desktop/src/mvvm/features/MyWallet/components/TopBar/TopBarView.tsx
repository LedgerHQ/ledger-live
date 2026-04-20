import React from "react";
import { TopBarActionButton } from "LLD/components/TopBar/components/TopBarActionButton";
import type { MyWalletTopBarViewProps } from "./types";

const TopBarView = ({ settingsAction }: MyWalletTopBarViewProps) => (
  <div className="flex justify-between items-center">
    <p className="body-2 text-base">My Wallet</p>
    <div className="flex gap-16">
      <p className="body-2 text-base">Notifications</p>
      <TopBarActionButton {...settingsAction} />
    </div>
  </div>
);

export default TopBarView;
