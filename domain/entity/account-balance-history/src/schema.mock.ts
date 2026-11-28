import { AssetBalanceHistorySchema, type AssetBalanceHistory } from "./schema";

type AssetBalanceHistoryInput = {
  assetId: string;
  points: { date: string; balance: string; countervalues?: Record<string, string> }[];
};

export function mockAssetBalanceHistory(
  overrides?: Partial<AssetBalanceHistoryInput>,
): AssetBalanceHistory {
  return AssetBalanceHistorySchema.parse({
    assetId: "ethereum",
    points: [
      { date: "2026-01-01T00:00:00.000Z", balance: "5" },
      { date: "2026-01-02T00:00:00.000Z", balance: "10" },
    ],
    ...overrides,
  });
}
