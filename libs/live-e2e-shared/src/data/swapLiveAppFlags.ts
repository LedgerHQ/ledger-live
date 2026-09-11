// swap-live-app merges this localStorage key over its Firebase flags.
export const SWAP_FLAG_OVERRIDES_KEY = "feature-flag-overrides";

export type QuoteCardVariant = "legacy" | "lumen";

// The two values the A/B test serves. The merge is shallow per key, so a preset holds the
// whole flag object. `variant` is tracking only.
export const swapFlagPresets = {
  lumenQuoteCardDisabled: { ptxLumenQuoteCard: { enabled: false } },
  lumenQuoteCardEnabled: {
    ptxLumenQuoteCard: {
      enabled: true,
      params: { internalVariant: "ptxLumenQuoteSameCtaCopy" },
    },
  },
} as const;

export type SwapFlagPreset = keyof typeof swapFlagPresets;

export const swapFlagPresetPayload = (preset: SwapFlagPreset): string =>
  JSON.stringify(swapFlagPresets[preset]);

// `enabled` alone picks the card. Both presets share the CTA copy.
export const quoteCardVariantByPreset: Record<SwapFlagPreset, QuoteCardVariant> = {
  lumenQuoteCardDisabled: "legacy",
  lumenQuoteCardEnabled: "lumen",
};

// Contains-match finds any card, a prefix pins one variant.
export const QUOTE_CARD_PROVIDER_NAME_FRAGMENT = "quote-card-provider-name-";

export const quoteCardVariantPrefix: Record<QuoteCardVariant, string> = {
  legacy: `compact-${QUOTE_CARD_PROVIDER_NAME_FRAGMENT}`,
  lumen: `lumen-${QUOTE_CARD_PROVIDER_NAME_FRAGMENT}`,
};

// The testid ends with the provider id, so anchor the end: a contains-match would also
// find a longer id (moonpay finds moonpay_trade).
export const quoteCardProviderNameSelector = (providerName: string): string =>
  `[data-testid$='${QUOTE_CARD_PROVIDER_NAME_FRAGMENT}${providerName.toLowerCase()}']`;

// Provider UI names (e.g. "LI.FI") can carry regex metacharacters.
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Both presets name the provider. Unpinned runs also accept the short copy, which
// Firebase still serves today.
export const quoteCardCtaPattern = ({
  providerUiName,
  approvalRequired = false,
  pinned = false,
}: {
  providerUiName: string;
  approvalRequired?: boolean;
  pinned?: boolean;
}): RegExp => {
  const verbs = approvalRequired ? "Continue|Approve spending" : "Swap|Continue";
  const withProvider = `(?:${verbs}) with ${escapeRegExp(providerUiName)}`;
  const short = approvalRequired ? "Continue" : "Review";
  return new RegExp(pinned ? `^${withProvider}$` : `^(?:${short}|${withProvider})$`, "i");
};
