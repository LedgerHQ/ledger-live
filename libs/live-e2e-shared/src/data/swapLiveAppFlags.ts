// Fixture data for the swap-live-app ptxLumenQuoteCard A/B test: which flag value a spec runs
// against, and how to write it. The DOM that goes with it (testid prefixes, CTA copy) lives in
// each suite's swap page object, because locators belong to the page object.

// swap-live-app merges this localStorage key over its Firebase flags.
export const SWAP_FLAG_OVERRIDES_KEY = "feature-flag-overrides";

export type QuoteCardVariant = "legacy" | "lumen";

// TODO(LIVE-37173): when ptxLumenQuoteCard is retired, delete this module and the
// quoteCardVariantPrefix helpers in both swap page objects. SWAP_FLAG_OVERRIDES_KEY is the one
// part that outlives the experiment: it pins any swap-live-app flag.
// The two values the A/B test serves. The merge is shallow per key, so a preset holds the
// whole flag object.
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

// Every swap spec pins a preset, so no test asserts against a card Firebase chose for it.
// This arm keeps the provider name in the CTA, which quoteCardCtaPattern requires; other
// Lumen arms render a bare "Review" and would fail every CTA check.
export const DEFAULT_SWAP_FLAG_PRESET: SwapFlagPreset = "lumenQuoteCardEnabled";

// Derived, so a new preset always gets a test case.
export const swapFlagPresetNames = Object.keys(swapFlagPresets) as SwapFlagPreset[];

export const swapFlagPresetPayload = (preset: SwapFlagPreset): string =>
  JSON.stringify(swapFlagPresets[preset]);

// `enabled` alone picks the card. Both presets share the CTA copy.
export const quoteCardVariantByPreset: Record<SwapFlagPreset, QuoteCardVariant> = {
  lumenQuoteCardDisabled: "legacy",
  lumenQuoteCardEnabled: "lumen",
};

// The variant a pinned test must NOT see, so the check can assert its absence too.
export const otherQuoteCardVariant = (variant: QuoteCardVariant): QuoteCardVariant =>
  variant === "lumen" ? "legacy" : "lumen";
