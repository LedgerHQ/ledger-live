import React from "react";
import { Avatar, type AvatarProps } from "@ledgerhq/lumen-ui-rnative";
import { USER_AVATAR_URL } from "./constants";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
  showNotification?: AvatarProps["showNotification"];
};

export function UserAvatar({ size = "lg", lx, showNotification }: Readonly<Props>) {
  return (
    <Avatar
      size={size}
      src={USER_AVATAR_URL}
      alt="My wallet avatar"
      testID="my-wallet-avatar"
      lx={lx}
      showNotification={showNotification}
    />
  );
}
