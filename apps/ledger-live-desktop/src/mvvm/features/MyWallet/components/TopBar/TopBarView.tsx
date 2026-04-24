import React from "react";
import { TopBarActionButton } from "LLD/components/TopBar/components/TopBarActionButton";
import type { MyWalletTopBarViewProps } from "./types";
import { UserAvatar } from "../UserAvatar";

const TopBarView = ({ title, settingsAction, notificationAction }: MyWalletTopBarViewProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-12">
      <UserAvatar showNotification={false} />
      <p className="body-1-semi-bold text-base">{title}</p>
    </div>
    <div className="flex gap-16">
      <TopBarActionButton {...notificationAction} />
      <TopBarActionButton {...settingsAction} />
    </div>
  </div>
);

export default TopBarView;
