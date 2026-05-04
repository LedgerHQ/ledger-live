import React from "react";
import { getEnv } from "@ledgerhq/live-env";
import { Avatar, type AvatarProps } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
  showNotification?: AvatarProps["showNotification"];
};

export function UserAvatar({ size = "lg", lx, showNotification }: Readonly<Props>) {
  const src = `${getEnv("LW_ICONS_AVATARS_CDN_BASE_URL")}/black/user.png`;

  return (
    <Avatar
      size={size}
      src={src}
      alt="My wallet avatar"
      testID="my-wallet-avatar"
      lx={lx}
      showNotification={showNotification}
    />
  );
}
