import React from "react";
import { Avatar, type AvatarProps } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
};

export function UserAvatar({ size = "lg", lx }: Readonly<Props>) {
  return <Avatar size={size} alt="My wallet avatar" testID="my-wallet-avatar" lx={lx} />;
}
