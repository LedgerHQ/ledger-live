import React from "react";
import {
  Avatar,
  DotIndicator,
  getDotIndicatorProps,
  type AvatarProps,
} from "@ledgerhq/lumen-ui-rnative";
import { USER_AVATAR_URL } from "./constants";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
  showNotification?: boolean;
};

export function UserAvatar({ size = "lg", lx, showNotification }: Readonly<Props>) {
  const dotIndicatorProps = getDotIndicatorProps("avatar", size === "sm" ? "sm" : "md");

  const avatar = (
    <Avatar
      size={size}
      src={USER_AVATAR_URL}
      alt="My wallet avatar"
      testID="my-wallet-avatar"
      lx={lx}
    />
  );

  return showNotification ? <DotIndicator {...dotIndicatorProps}>{avatar}</DotIndicator> : avatar;
}
