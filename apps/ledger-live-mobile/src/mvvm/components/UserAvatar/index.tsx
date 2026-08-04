import React from "react";
import {
  Avatar,
  AvatarButton,
  DotIndicator,
  getDotIndicatorProps,
  type AvatarProps,
} from "@ledgerhq/lumen-ui-rnative";
import { USER_AVATAR_URL } from "./constants";

type Props = {
  size?: AvatarProps["size"];
  lx?: AvatarProps["lx"];
  showNotification?: boolean;
  /** When provided, renders an interactive `AvatarButton` instead of a plain `Avatar`. */
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

export function UserAvatar({
  size = "lg",
  lx,
  showNotification,
  onPress,
  testID = "my-wallet-avatar",
  accessibilityLabel,
}: Readonly<Props>) {
  const dotIndicatorProps = getDotIndicatorProps("avatar", size);

  const avatar = onPress ? (
    <AvatarButton
      size={size}
      src={USER_AVATAR_URL}
      alt="My wallet avatar"
      onPress={onPress}
      lx={lx}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      appearance="thick"
    />
  ) : (
    <Avatar size={size} src={USER_AVATAR_URL} alt="My wallet avatar" testID={testID} lx={lx} />
  );

  return showNotification ? <DotIndicator {...dotIndicatorProps}>{avatar}</DotIndicator> : avatar;
}
