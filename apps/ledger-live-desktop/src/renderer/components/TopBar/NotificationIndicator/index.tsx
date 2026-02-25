import Tooltip from "~/renderer/components/Tooltip";
import React from "react";
import { ItemContainer } from "../shared";
import IconBell from "~/renderer/icons/Bell";
import { useTranslation } from "react-i18next";
import { InformationDrawer } from "./InformationDrawer";
import { useInformationCenter } from "LLD/components/TopBar/hooks/useInformationCenter";
import { useNotificationIndicator } from "LLD/components/TopBar/hooks/useNotificationIndicator";

export function NotificationIndicator() {
  const { t } = useTranslation();
  const { isOpen, onRequestClose } = useInformationCenter();
  const { onClick: handleOpenNotificationCenter, totalNotifCount } = useNotificationIndicator();

  return (
    <>
      <InformationDrawer isOpen={isOpen} onRequestClose={onRequestClose} />
      <Tooltip content={t("informationCenter.tooltip")} placement="bottom">
        <ItemContainer
          data-testid="topbar-notification-button"
          isInteractive
          onClick={handleOpenNotificationCenter}
        >
          <IconBell size={18} count={totalNotifCount} />
        </ItemContainer>
      </Tooltip>
    </>
  );
}
