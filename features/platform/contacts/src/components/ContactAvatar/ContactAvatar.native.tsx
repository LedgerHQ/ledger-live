import React from "react";
import { Avatar, useResolveAvatarColor } from "@ledgerhq/lumen-ui-rnative";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";
import { useContactDisplayName } from "../../hooks/useContactDisplayName";
import { MeAvatar } from "../MeAvatar/MeAvatar";
import type { ContactAvatarProps } from "./ContactAvatar.types";

export function ContactAvatar({
  contactId,
  name,
  isMe,
  size = "sm",
  testID,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestID = testID ?? `contacts-avatar-${contactId}`;
  const avatarFallbackColor = useResolveAvatarColor(contactId);
  const getDisplayName = useContactDisplayName();

  if (isMe) {
    return <MeAvatar label={getDisplayName({ name, isMe })} size={size} testId={resolvedTestID} />;
  }

  return (
    <Avatar
      testID={resolvedTestID}
      size={size}
      alt={name}
      fallbackText={getContactAvatarInitials(name)}
      fallbackColor={avatarFallbackColor}
    />
  );
}
