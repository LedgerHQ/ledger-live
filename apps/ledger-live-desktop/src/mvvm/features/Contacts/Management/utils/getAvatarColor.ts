/**
 * Deterministic per-name avatar background color.
 *
 * The Figma design (frame 13802:2833) shows each contact's initials avatar
 * tinted a different pastel — Anna Kulikova green, Baptiste Bouvet pink,
 * Benoit Lucet pink, John Smith lavender, etc. We don't have a per-contact
 * `color` field in the local Contacts store and we don't want one — the
 * color is purely a visual aid, so we derive it from the name.
 *
 * TODO(lumen-adoption): if Lumen ships a typed Avatar palette, pull these
 * tokens from there instead of hard-coding the hex.
 */

// Pastel palette matching the warmth and saturation level used in the
// Figma comp. Ordered by hue so adjacent indices look distinct.
const PALETTE = [
  "#EEBEBE", // pink
  "#FBCDA2", // peach
  "#F7E7A4", // butter
  "#C6E8B4", // mint
  "#A8DDDF", // sky
  "#C8C2EE", // lavender
  "#E5BCDE", // rose
];

/**
 * djb2-ish hash. Stable across reloads. Not security-sensitive — only used
 * to map a name → palette index.
 */
function hash(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getAvatarColor(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return PALETTE[0];
  return PALETTE[hash(normalized) % PALETTE.length];
}
