import React from "react";
import { Avatar, type AvatarProps } from "@ledgerhq/lumen-ui-rnative";
import { MY_WALLET_AVATAR_USER_URL } from "./constants";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
  showNotification?: AvatarProps["showNotification"];
};

export function UserAvatar({ size = "lg", lx, showNotification }: Readonly<Props>) {
  return (
    <Avatar
      size={size}
      src={MY_WALLET_AVATAR_USER_URL}
      alt="My wallet avatar"
      testID="my-wallet-avatar"
      lx={lx}
      showNotification={showNotification}
    />
  );
}
