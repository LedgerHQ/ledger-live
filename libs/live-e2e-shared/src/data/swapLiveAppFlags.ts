// swap-live-app merges this localStorage key over its Firebase flags, so e2e can pin one variant.
export const SWAP_FLAG_OVERRIDES_KEY = "feature-flag-overrides";

export type QuoteCardMarkup = "lumen" | "compact";
export type QuoteCardCtaCopy = "short" | "provider";

// The merge is shallow per key, so a preset holds the whole flag object. Of the four
// LIVE-37173 variants only the CTA copy is observable: the design variants just swap CSS classes.
export const swapFlagPresets = {
  quoteCardShortCta: { ptxLumenQuoteCard: { enabled: true } },
  quoteCardProviderCta: {
    ptxLumenQuoteCard: {
      enabled: true,
      params: { internalVariant: "ptxLumenQuoteSameCtaCopy" },
    },
  },
  quoteCardCompact: { ptxLumenQuoteCard: { enabled: false } },
} as const;

export type SwapFlagPreset = keyof typeof swapFlagPresets;

export const swapFlagPresetPayload = (preset: SwapFlagPreset): string =>
  JSON.stringify(swapFlagPresets[preset]);

export const swapFlagPresetQuoteCard: Record<
  SwapFlagPreset,
  { markup: QuoteCardMarkup; ctaCopy: QuoteCardCtaCopy }
> = {
  quoteCardShortCta: { markup: "lumen", ctaCopy: "short" },
  quoteCardProviderCta: { markup: "lumen", ctaCopy: "provider" },
  quoteCardCompact: { markup: "compact", ctaCopy: "provider" },
};

// Shared by both markups: contains-match finds any card, a prefix pins one markup.
export const QUOTE_CARD_PROVIDER_NAME_FRAGMENT = "quote-card-provider-name-";

export const quoteCardMarkupPrefix: Record<QuoteCardMarkup, string> = {
  lumen: `lumen-${QUOTE_CARD_PROVIDER_NAME_FRAGMENT}`,
  compact: `compact-${QUOTE_CARD_PROVIDER_NAME_FRAGMENT}`,
};

// Provider UI names (e.g. "LI.FI") can carry regex metacharacters.
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// No pinned copy means both shapes pass: the deployed app owns the variant.
export const quoteCardCtaPattern = ({
  providerUiName,
  approvalRequired = false,
  copy,
}: {
  providerUiName: string;
  approvalRequired?: boolean;
  copy?: QuoteCardCtaCopy | null;
}): RegExp => {
  const shortShape = approvalRequired ? "Continue" : "Review";
  const providerVerbs = approvalRequired ? "Continue|Approve spending" : "Swap|Continue";
  const providerShape = `(?:${providerVerbs}) with ${escapeRegExp(providerUiName)}`;
  const shapes =
    copy === "short"
      ? [shortShape]
      : copy === "provider"
        ? [providerShape]
        : [shortShape, providerShape];
  return new RegExp(`^(?:${shapes.join("|")})$`, "i");
};
