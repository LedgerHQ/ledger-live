import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";

const { bg, text } = ledgerLiveThemes.dark.colors;

/** Theming the card issuer applies to the hosted PAN/CVV image, so it matches the card face. */
export const DETAILS_IMAGE_CSS = {
  cardBackgroundColor: bg.muted,
  cardTextColor: text.base,
  panBackgroundColor: bg.surface,
  panTextColor: text.base,
} as const;
