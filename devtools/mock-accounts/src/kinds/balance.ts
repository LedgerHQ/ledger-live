import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import { randomAmount } from "../random";
import type { MockReader } from "../families/types";

export const balanceRow = (
  assetId: string,
  balance: bigint,
  spendableBalance = balance,
): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({
    assetId,
    balance: balance.toString(),
    spendableBalance: spendableBalance.toString(),
  });

/** The native coin only: one account in ten empty, the others between 0.01 and 100 coins. */
export const balance: MockReader<"balance"> = ({ currency, random }) => {
  const amount = random() < 0.1 ? 0n : randomAmount(random, currency.units[0].magnitude, 0.01, 100);
  return [balanceRow(currency.id, amount)];
};
