import React from "react";
import { TopBarActionButton } from "LLD/components/TopBar/components/TopBarActionButton";
import type { MyWalletTopBarViewProps } from "./types";

const TopBarView = ({ settingsAction, notificationAction }: MyWalletTopBarViewProps) => (
  <div className="flex justify-between items-center">
    <p className="body-2 text-base">My Wallet</p>
    <div className="flex gap-16">
      <TopBarActionButton {...notificationAction} />
      <TopBarActionButton {...settingsAction} />
    </div>
  </div>
);

export default TopBarView;
