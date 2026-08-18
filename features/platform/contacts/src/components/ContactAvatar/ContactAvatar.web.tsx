import React from "react";
import {
  Avatar,
  resolveAvatarColor,
  type AvatarProps as LumenAvatarProps,
} from "@ledgerhq/lumen-ui-react";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  isMe?: boolean;
  src?: string;
  ariaHidden?: boolean;
  ariaLabel?: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  isMe = false,
  src,
  ariaHidden = false,
  ariaLabel,
  size = "sm",
  testId,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestId = testId ?? `contacts-avatar-${contactId}`;
  const resolvedAriaLabel = ariaLabel ?? name;
  let accessibilityProps: {
    "aria-hidden"?: true;
    "aria-label"?: string;
    role?: "img";
  } = {};
  if (ariaHidden) {
    accessibilityProps = { "aria-hidden": true };
  } else if (resolvedAriaLabel) {
    accessibilityProps = { role: "img", "aria-label": resolvedAriaLabel };
  } else {
    accessibilityProps = { role: undefined, "aria-label": undefined };
  }

  if (isMe) {
    return (
      <Avatar
        size={size}
        src={src}
        alt={resolvedAriaLabel}
        data-testid={resolvedTestId}
        {...accessibilityProps}
      />
    );
  }

  return (
    <Avatar
      size={size}
      alt={resolvedAriaLabel}
      fallbackText={getContactAvatarInitials(name)}
      fallbackColor={resolveAvatarColor(contactId)}
      data-testid={resolvedTestId}
      {...accessibilityProps}
    />
  );
}
