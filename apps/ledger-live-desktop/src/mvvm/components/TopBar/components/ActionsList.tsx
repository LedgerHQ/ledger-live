import React from "react";
import { TopBarSlot } from "../types";
import { NotificationIndicator } from "./NotificationIndicator";
import { HistoryButton } from "./HistoryButton";
import { TopBarActionButton } from "./TopBarActionButton";

type TopBarActionsListProps = {
  slots: TopBarSlot[];
};

export const TopBarActionsList = ({ slots }: TopBarActionsListProps) => (
  <div className="flex items-center gap-12" data-testid="top-bar-actions-list">
    {slots.map(slot => {
      if (slot.type === "notification") {
        return <NotificationIndicator key="notification" />;
      }
      if (slot.type === "history") {
        return <HistoryButton key="history" />;
      }
      return <TopBarActionButton key={slot.action.label} {...slot.action} />;
    })}
  </div>
);
