import React from "react";
import {
  Avatar,
  useResolveAvatarColor,
  type AvatarProps as LumenAvatarProps,
} from "@ledgerhq/lumen-ui-rnative";
import { DEFAULT_ME_CONTACT_ID, type ContactId } from "@domain/entity-contact";
import { getContactAvatarInitials } from "../../utils/getContactAvatarInitials";
import { MeAvatar } from "../MeAvatar/MeAvatar.native";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  name: string;
  size?: LumenAvatarProps["size"];
  testId?: string;
}>;

export function ContactAvatar({
  contactId,
  name,
  size = "sm",
  testId,
}: ContactAvatarProps): React.JSX.Element {
  const resolvedTestID = testId ?? `contacts-avatar-${contactId}`;
  const avatarFallbackColor = useResolveAvatarColor(contactId);

  if (contactId === DEFAULT_ME_CONTACT_ID) {
    return <MeAvatar name={name} size={size} testId={resolvedTestID} />;
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
