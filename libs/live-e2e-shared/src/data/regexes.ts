export const floatNumberRegex = /^\d+\.?\d+$/;

// Escapes regex metacharacters so a dynamic value (ticker, provider name, currency name, ...)
// can be embedded in a RegExp and matched literally.
export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
