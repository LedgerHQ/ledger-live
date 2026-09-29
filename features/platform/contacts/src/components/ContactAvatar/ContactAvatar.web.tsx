import React from "react";
import {
  Avatar,
  resolveAvatarColor,
  type AvatarProps as LumenAvatarProps,
} from "@ledgerhq/lumen-ui-react";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";
import { useContactDisplayName } from "../../hooks/useContactDisplayName";
import { MeAvatar } from "../MeAvatar/MeAvatar.web";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  /** Raw contact name: the avatar formats it for Me. */
  name: string;
  isMe: boolean;
  ariaHidden?: boolean;
  ariaLabel?: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  isMe,
  ariaHidden = false,
  ariaLabel,
  size = "sm",
  testId,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestId = testId ?? `contacts-avatar-${contactId}`;
  const getDisplayName = useContactDisplayName();
  const resolvedAriaLabel = ariaLabel ?? getDisplayName({ name, isMe });
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
      <MeAvatar
        label={resolvedAriaLabel}
        size={size}
        testId={resolvedTestId}
        ariaHidden={ariaHidden}
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
