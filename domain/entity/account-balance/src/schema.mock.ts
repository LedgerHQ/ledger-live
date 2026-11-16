import {
  AccountAssetBalanceSchema,
  BalanceLockSchema,
  type AccountAssetBalance,
  type BalanceLock,
} from "./schema";

type AccountAssetBalanceInput = {
  assetId: string;
  balance: string;
  spendableBalance: string;
  locked: { reason: string; amount: string }[];
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

export function mockBalanceLock(
  overrides?: Partial<{ reason: string; amount: string }>,
): BalanceLock {
  return BalanceLockSchema.parse({ reason: "staked", amount: "4", ...overrides });
}
