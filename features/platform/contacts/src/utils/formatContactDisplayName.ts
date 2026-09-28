import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";

export type ContactDisplayNameInput = Readonly<{ name: string; isMe: boolean }>;

type Translate = (key: string, options?: Readonly<{ name: string }>) => string;

/** The one rule for showing a contact's name: Me is always "<name> (Me)", or "My addresses (Me)". */
export function formatContactDisplayName({ name, isMe }: ContactDisplayNameInput, t: Translate) {
  if (!isMe) {
    return name;
  }

  const meName = name === DEFAULT_ME_CONTACT_NAME ? t("contacts.me.myAddresses") : name;
  return t("contacts.detail.meDisplayName", { name: meName });
}
