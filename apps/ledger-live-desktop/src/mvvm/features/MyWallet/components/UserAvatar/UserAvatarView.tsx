import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, DotIndicator, getDotIndicatorProps } from "@ledgerhq/lumen-ui-react";
import { MY_WALLET_AVATAR_USER_URL } from "./constants";
import { UserAvatarViewProps } from "./types";

export function UserAvatarView({
  showNotification,
  unseenCount,
  size = "md",
}: UserAvatarViewProps) {
  const { t } = useTranslation();

  const ariaLabel =
    showNotification && unseenCount > 0
      ? t("myWallet.avatar.labelWithNotifications", { count: unseenCount })
      : t("myWallet.avatar.label");

  const dotIndicatorProps = getDotIndicatorProps("avatar", size === "sm" ? "sm" : "md");

  const avatar = (
    <Avatar
      size={size}
      src={MY_WALLET_AVATAR_USER_URL}
      aria-label={ariaLabel}
      data-testid="my-wallet-avatar"
    />
  );

  return showNotification ? <DotIndicator {...dotIndicatorProps}>{avatar}</DotIndicator> : avatar;
}
