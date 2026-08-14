import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-react";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarColorClass } from "../../utils/getContactAvatarColorClass";
import { getContactInitial } from "../../utils/getContactInitial";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  isMe?: boolean;
  src?: string;
  ariaHidden?: boolean;
  ariaLabel?: string;
  size?: "sm" | "xl";
  testId?: string;
}>;

const avatarSizeClasses = {
  sm: "body-2-semi-bold size-32",
  xl: "heading-3-semi-bold size-80",
} as const;

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
  }

  if (isMe) {
    return <Avatar size={size} src={src} data-testid={resolvedTestId} {...accessibilityProps} />;
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${avatarSizeClasses[size]} ${getContactAvatarColorClass(contactId)}`}
      data-testid={resolvedTestId}
      {...accessibilityProps}
    >
      {getContactInitial(name)}
    </div>
  );
}
