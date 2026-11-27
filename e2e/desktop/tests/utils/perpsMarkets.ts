export type PerpsOrderSide = "long" | "short";

export type ProviderPosition = { marketId: string; symbol: string };

export type PerpsMarketGroup = {
  label: string;
  // Test id of the live app market rows.
  marketTestId: RegExp;
  // Perps API market ids of the group.
  marketId: RegExp;
  // Market a test setup opens through the Perps driver.
  setupMarketId: string;
  liveAppFlags: Record<string, boolean>;
};

export const HIP3_MARKETS = {
  label: "HIP-3",
  marketTestId: /^market-item-xyz:/,
  marketId: /^hyperliquid-xyz-xyz:/,
  setupMarketId: "hyperliquid-xyz-xyz:xyz100-usdc",
  liveAppFlags: { ptxPerpsHip3: true },
} satisfies PerpsMarketGroup;
