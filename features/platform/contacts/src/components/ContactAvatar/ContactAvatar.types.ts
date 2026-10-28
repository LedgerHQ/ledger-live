import type { ContactId } from "@domain/entity-contact";

export type ContactAvatarProps = Readonly<{
  contactId: ContactId;
  /** Raw contact name: the avatar formats it for Me. */
  name: string;
  isMe: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** @platform web Hides a decorative avatar from assistive technologies. */
  ariaHidden?: boolean;
  testID?: string;
}>;
