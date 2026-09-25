import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";

export type FormatMeDisplayName = (name: string) => string;

export const identityFormatMeDisplayName: FormatMeDisplayName = name => name;

export function createMeDisplayNameFormatter(
  defaultName: string,
  formatName: FormatMeDisplayName,
): FormatMeDisplayName {
  return name => formatName(name === DEFAULT_ME_CONTACT_NAME ? defaultName : name);
}
