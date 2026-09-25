import React from "react";
import {
  Avatar,
  useResolveAvatarColor,
  type AvatarProps as LumenAvatarProps,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactId } from "@domain/entity-contact";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";
import { useContactDisplayName } from "../../hooks/useContactDisplayName";
import { MeAvatar } from "../MeAvatar/MeAvatar.native";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  /** Raw contact name: the avatar formats it for Me. */
  name: string;
  isMe: boolean;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  isMe,
  size = "sm",
  testId,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestID = testId ?? `contacts-avatar-${contactId}`;
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
