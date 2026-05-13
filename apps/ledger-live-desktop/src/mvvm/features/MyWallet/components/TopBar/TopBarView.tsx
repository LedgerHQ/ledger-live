import React from "react";
import { TopBarActionButton } from "LLD/components/TopBar/components/TopBarActionButton";
import type { MyWalletTopBarViewProps } from "./types";
import { UserAvatar } from "../UserAvatar";

const TopBarView = ({ settingsAction, notificationAction }: MyWalletTopBarViewProps) => (
  <div className="flex justify-between items-center">
    <UserAvatar showNotification={false} size="md" />

    <div className="flex gap-16">
      <TopBarActionButton {...notificationAction} />
      <TopBarActionButton {...settingsAction} />
    </div>
  </div>
);

export default TopBarView;
