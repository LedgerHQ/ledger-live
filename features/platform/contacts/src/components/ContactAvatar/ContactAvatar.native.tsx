import React from "react";
import { Avatar, resolveAvatarColor } from "@ledgerhq/lumen-ui-rnative";
import type { ContactId } from "@domain/entity-contact";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  isMe?: boolean;
  src?: string;
  size?: "sm" | "xl";
  testID?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  isMe = false,
  src,
  size = "sm",
  testID,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestID = testID ?? `contacts-avatar-${contactId}`;

  if (isMe) {
    return <Avatar testID={resolvedTestID} size={size} src={src} alt={name} />;
  }

  return (
    <Avatar
      testID={resolvedTestID}
      size={size}
      alt={name}
      fallbackColor={resolveAvatarColor(contactId)}
    />
  );
}
