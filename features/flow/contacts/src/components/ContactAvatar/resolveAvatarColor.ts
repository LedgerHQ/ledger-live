import type { ContactId } from "@domain/entity-contact";

const CONTACT_AVATAR_COLORS = [
  "avatarRed",
  "avatarOrange",
  "avatarYellow",
  "avatarGreen",
  "avatarBlue",
  "avatarPurple",
  "avatarPink",
  "avatarTurquoise",
] as const;

export function resolveAvatarColor(contactId: ContactId) {
  let hash = 0;

  for (const character of contactId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return CONTACT_AVATAR_COLORS[hash % CONTACT_AVATAR_COLORS.length];
}
