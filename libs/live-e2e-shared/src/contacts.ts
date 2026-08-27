import { randomUUID } from "node:crypto";

// Every separator a user can type. The straight `'` is excluded: iOS rewrites it to `’` on input.
const CONTACT_NAME_FORMAT_SAMPLE = "O’Neil-Zoé";

/**
 * Valid contact name, unique per call — duplicates are rejected on save.
 *
 * @see [ContactNamePattern](../../../domain/entity/contact/src/schema.ts) for the accepted format.
 */
export function generateContactName(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6);

  return `${CONTACT_NAME_FORMAT_SAMPLE} ${suffix}`.normalize("NFC");
}
