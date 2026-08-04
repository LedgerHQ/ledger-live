import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarButton, DotIndicator, getDotIndicatorProps } from "@ledgerhq/lumen-ui-react";
import { MY_WALLET_AVATAR_USER_URL } from "./constants";
import { UserAvatarViewProps } from "./types";

export function UserAvatarView({
  showNotification,
  unseenCount,
  size = "md",
  interactive = false,
  ...buttonProps
}: UserAvatarViewProps) {
  const { t } = useTranslation();

  const ariaLabel =
    showNotification && unseenCount > 0
      ? t("myWallet.avatar.labelWithNotifications", { count: unseenCount })
      : t("myWallet.avatar.label");

  const dotIndicatorProps = getDotIndicatorProps("avatar", size);

  const avatar = interactive ? (
    <AvatarButton
      className="flex"
      size={size}
      src={MY_WALLET_AVATAR_USER_URL}
      alt={ariaLabel}
      data-testid="my-wallet-avatar"
      appearance="thick"
      {...buttonProps}
    />
  ) : (
    <Avatar
      size={size}
      src={MY_WALLET_AVATAR_USER_URL}
      aria-label={ariaLabel}
      data-testid="my-wallet-avatar"
    />
  );

  return showNotification ? <DotIndicator {...dotIndicatorProps}>{avatar}</DotIndicator> : avatar;
}
