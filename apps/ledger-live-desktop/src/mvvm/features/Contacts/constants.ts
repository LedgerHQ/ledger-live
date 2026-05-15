/**
 * Mirrors `device-sdk-ts/packages/device-management-kit/src/api/contacts/validation.ts`.
 * The device-side buffers include a NUL terminator, so the usable text length is
 * `BUFFER_LENGTH - 1`. Exposing the usable count (not the raw buffer length) keeps
 * the UI char-counters readable.
 */
export const LIMITS = {
  contactName: 32,
  addressLabel: 32,
  accountName: 32,
  addressHexChars: 40,
};

export const PRINTABLE_ASCII = /^[\x20-\x7E]*$/;
