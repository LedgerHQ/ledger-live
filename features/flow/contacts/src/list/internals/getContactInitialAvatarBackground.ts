import type { ContactId } from "@domain/entity-contact";

const CONTACT_INITIAL_AVATAR_BACKGROUNDS = [
  "avatarRed",
  "avatarOrange",
  "avatarYellow",
  "avatarGreen",
  "avatarBlue",
  "avatarPurple",
  "avatarPink",
  "avatarTurquoise",
] as const;

export function getContactInitialAvatarBackground(contactId: ContactId) {
  let hash = 0;

  for (const character of contactId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return CONTACT_INITIAL_AVATAR_BACKGROUNDS[hash % CONTACT_INITIAL_AVATAR_BACKGROUNDS.length];
}
