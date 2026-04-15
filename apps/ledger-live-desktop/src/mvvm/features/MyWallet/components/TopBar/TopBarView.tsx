import React from "react";
import { TopBarActionButton } from "LLD/components/TopBar/components/TopBarActionButton";
import type { MyWalletTopBarViewProps } from "./types";
import { UserAvatar } from "../UserAvatar";

const TopBarView = ({ settingsAction, notificationAction }: MyWalletTopBarViewProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-12">
      <UserAvatar />
      <p className="body-2 text-base">My Wallet</p>
    </div>
    <div className="flex gap-16">
      <TopBarActionButton {...notificationAction} />
      <TopBarActionButton {...settingsAction} />
    </div>
  </div>
);

export default TopBarView;
