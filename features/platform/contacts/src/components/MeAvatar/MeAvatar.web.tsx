import React from "react";
import { Avatar, type AvatarProps as LumenAvatarProps } from "@ledgerhq/lumen-ui-react";
import { ME_AVATAR_URL } from "./meAvatarUrl";

export type MeAvatarProps = Readonly<{
  name: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
  ariaHidden?: boolean;
}>;

/** The one avatar for Me: ContactAvatar renders it for the Me contact. */
export function MeAvatar({
  name,
  size = "sm",
  testId,
  ariaHidden = false,
}: MeAvatarProps): React.JSX.Element {
  const accessibilityProps = ariaHidden
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": name };

  return (
    <Avatar
      size={size}
      src={ME_AVATAR_URL}
      alt={name}
      data-testid={testId}
      {...accessibilityProps}
    />
  );
}
