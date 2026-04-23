import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@ledgerhq/lumen-ui-react";
import { UserAvatarViewProps } from "./types";

export function UserAvatarView({ showNotification, unseenCount }: UserAvatarViewProps) {
  const { t } = useTranslation();

  const ariaLabel =
    showNotification && unseenCount > 0
      ? t("myWallet.avatar.labelWithNotifications", { count: unseenCount })
      : t("myWallet.avatar.label");

  return (
    <Avatar
      size="sm"
      aria-label={ariaLabel}
      data-testid="my-wallet-avatar"
      className="text-black dark:text-white"
      showNotification={showNotification}
    />
  );
}
