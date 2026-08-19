import React from "react";
import { Avatar, type AvatarProps as LumenAvatarProps } from "@ledgerhq/lumen-ui-react";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarColorClass } from "../../utils/getContactAvatarColorClass";
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

const avatarSizeClasses: Record<NonNullable<LumenAvatarProps["size"]>, string> = {
  xs: "body-4-semi-bold size-24",
  sm: "body-1-semi-bold size-40",
  md: "heading-5-semi-bold size-48",
  lg: "heading-4-semi-bold size-56",
  xl: "heading-2-semi-bold size-72",
  "2xl": "heading-1-semi-bold size-128",
};

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
      {getContactAvatarInitials(name)}
    </div>
  );
}
