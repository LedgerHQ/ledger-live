import React from "react";
import { Avatar, type AvatarProps as LumenAvatarProps } from "@ledgerhq/lumen-ui-rnative";
import { ME_AVATAR_URL } from "./meAvatarUrl";

export type MeAvatarProps = Readonly<{
  name: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

/** The one avatar for Me: ContactAvatar renders it for the Me contact. */
export function MeAvatar({ name, size = "sm", testId }: MeAvatarProps): React.JSX.Element {
  return <Avatar testID={testId} size={size} appearance="thin" src={ME_AVATAR_URL} alt={name} />;
}
