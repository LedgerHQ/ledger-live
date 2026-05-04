import React from "react";
import { useNotificationIndicator } from "../hooks/useNotificationIndicator";
import { TopBarActionButton } from "./TopBarActionButton";

export function NotificationIndicator() {
  const {
    tooltip,
    icon,
    isInteractive,
    onClick: handleOpenNotificationCenter,
  } = useNotificationIndicator();

  return (
    <TopBarActionButton
      label="notifications"
      tooltip={tooltip}
      isInteractive={isInteractive}
      onClick={handleOpenNotificationCenter}
      icon={icon}
    />
  );
}
