export type PerpsOrderSide = "long" | "short";

export type ProviderPosition = { marketId: string; symbol: string };

export type PerpsMarketGroup = {
  label: string;
  // Test id of the live app market rows.
  marketTestId: RegExp;
  liveAppFlags: Record<string, boolean>;
};

export const HIP3_MARKETS = {
  label: "HIP-3",
  marketTestId: /^market-item-xyz:/,
  liveAppFlags: { ptxPerpsHip3: true },
} satisfies PerpsMarketGroup;
