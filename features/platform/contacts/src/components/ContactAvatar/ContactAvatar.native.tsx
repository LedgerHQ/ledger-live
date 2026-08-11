import React from "react";
import { Avatar, resolveAvatarColor } from "@ledgerhq/lumen-ui-rnative";
import type { ContactId } from "@domain/entity-contact";

type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  size?: "sm" | "xl";
  testID?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  size = "sm",
  testID,
}: ContactAvatarProps): React.JSX.Element {
  return (
    <Avatar
      testID={testID ?? `contacts-avatar-${contactId}`}
      size={size}
      alt={name}
      fallbackColor={resolveAvatarColor(contactId)}
    />
  );
}
