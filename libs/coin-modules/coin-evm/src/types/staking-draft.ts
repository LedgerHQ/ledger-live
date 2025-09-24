// draft file waiting for another merge (temporary)
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";

export type StakingIntent = {
  type: "staking";
};

export type StakingTransactionIntent<T extends StakingIntent> = TransactionIntent & T;

export type EvmStakingExtras = StakingIntent & {
  mode?: string;
  parameters?: string[];
};

export type EvmStakingIntent = StakingTransactionIntent<EvmStakingExtras>;

export function isStakingIntent(
  intent: TransactionIntent,
): intent is StakingTransactionIntent<never> {
  return intent.type === "staking";
}
