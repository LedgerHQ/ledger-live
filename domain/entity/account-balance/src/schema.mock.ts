import { AccountAssetBalanceSchema, type AccountAssetBalance } from "./schema";

type AccountAssetBalanceInput = {
  assetId: string;
  balance: string;
  spendableBalance: string;
};

export function mockAccountAssetBalance(
  overrides?: Partial<AccountAssetBalanceInput>,
): AccountAssetBalance {
  return AccountAssetBalanceSchema.parse({
    assetId: "ethereum",
    balance: "10",
    spendableBalance: "10",
    ...overrides,
  });
}
