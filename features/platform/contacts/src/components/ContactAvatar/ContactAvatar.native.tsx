import React from "react";
import {
  Avatar,
  resolveAvatarColor,
  type AvatarProps as LumenAvatarProps,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  isMe?: boolean;
  src?: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  isMe = false,
  src,
  size = "sm",
  testId,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestID = testId ?? `contacts-avatar-${contactId}`;

  if (isMe) {
    return (
      <Avatar
        testID={resolvedTestID}
        size={size}
        src={src}
        alt={name}
        fallbackText={getContactAvatarInitials(name)}
      />
    );
  }

  return (
    <Avatar
      testID={resolvedTestID}
      size={size}
      alt={name}
      fallbackText={getContactAvatarInitials(name)}
      fallbackColor={resolveAvatarColor(contactId)}
    />
  );
}
