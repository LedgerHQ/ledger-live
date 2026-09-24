import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";

const { bg, text } = ledgerLiveThemes.dark.colors;

export const CARD_GRADIENT_START = bg.base;
export const CARD_GRADIENT_END = bg.muted;
export const CARD_FACE_TEXT = text.base;

export const DETAILS_IMAGE_CSS = {
  cardBackgroundColor: bg.muted,
  cardTextColor: text.base,
  panBackgroundColor: bg.surface,
  panTextColor: text.base,
} as const;
