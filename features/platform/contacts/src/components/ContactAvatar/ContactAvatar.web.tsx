import React from "react";
import { Avatar, resolveAvatarColor } from "@ledgerhq/lumen-ui-react";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";
import { useContactDisplayName } from "../../hooks/useContactDisplayName";
import { MeAvatar } from "../MeAvatar/MeAvatar";
import type { ContactAvatarProps } from "./ContactAvatar.types";

export function ContactAvatar({
  contactId,
  name,
  isMe,
  ariaHidden = false,
  size = "sm",
  testID,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestId = testID ?? `contacts-avatar-${contactId}`;
  const getDisplayName = useContactDisplayName();
  const resolvedAriaLabel = getDisplayName({ name, isMe });
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
