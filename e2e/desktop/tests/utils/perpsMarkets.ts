export type PerpsMarketGroup = {
  label: string;
  // Test id of the market rows in the live app list.
  marketTestId: RegExp;
  // Live app feature flags the group needs.
  liveAppFlags: Record<string, boolean>;
};

export const HIP3_MARKETS = {
  label: "HIP-3",
  marketTestId: /^market-item-xyz:/,
  liveAppFlags: { ptxPerpsHip3: true },
} satisfies PerpsMarketGroup;
