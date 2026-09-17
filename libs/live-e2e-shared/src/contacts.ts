import { randomUUID } from "node:crypto";

// A space is the only separator ContactNamePattern accepts between name segments.
const CONTACT_NAME_FORMAT_SAMPLE = "O Neil Zoe";

/**
 * Valid contact name, unique per call — duplicates are rejected on save.
 *
 * @see [ContactNamePattern](../../../domain/entity/contact/src/schema.ts) for the accepted format.
 */
export function generateContactName(): string {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 6);

  return `${CONTACT_NAME_FORMAT_SAMPLE} ${suffix}`.normalize("NFC");
}
