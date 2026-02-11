import React from "react";
import { InformationDrawer } from "~/renderer/components/TopBar/NotificationIndicator/InformationDrawer";
import { useInformationCenter } from "../hooks/useInformationCenter";
import { useNotificationIndicator } from "../hooks/useNotificationIndicator";
import { TopBarActionButton } from "./TopBarActionButton";

export function NotificationIndicator() {
  const { isOpen, onRequestClose } = useInformationCenter();
  const {
    tooltip,
    icon,
    isInteractive,
    onClick: handleOpenNotificationCenter,
  } = useNotificationIndicator();

  return (
    <>
      <InformationDrawer isOpen={isOpen} onRequestClose={onRequestClose} />
      <TopBarActionButton
        label="notifications"
        tooltip={tooltip}
        isInteractive={isInteractive}
        onClick={handleOpenNotificationCenter}
        icon={icon}
        data-testid="topbar-action-button-notifications"
      />
    </>
  );
}
