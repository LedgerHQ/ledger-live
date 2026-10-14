import { getTransactionStakeAccount } from "@ledgerhq/live-common/families/solana/transactions";
import {
  useSolanaStakesWithMeta,
  useValidators,
} from "@ledgerhq/live-common/families/solana/react";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { ValidatorsAppValidator } from "@ledgerhq/live-common/families/solana/staking";
import type { Unit } from "@domain/entity-currency-unit";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";

type StakePositionMode = "delegate" | "undelegate";

/**
 * Resolves the staking position targeted by a stake transaction along with its validator, shared by
 * the deactivate and reactivate validator steps. Throws when the modal was opened on an account or
 * transaction it cannot render, which the surrounding stepper surfaces as an error.
 */
export function useStakeValidatorStep(
  account: SolanaAccount,
  transaction: Transaction | undefined | null,
  expectedMode: StakePositionMode,
): {
  unit: Unit;
  stake: SolanaStakingPosition;
  validator: ValidatorsAppValidator | undefined;
} {
  const unit = useMaybeAccountUnit(account);
  if (!account?.stakingResources || !transaction || !unit) {
    throw new Error("account, transaction and staking resources required");
  }
  const stakeAccAddr = getTransactionStakeAccount(transaction);
  if (!stakeAccAddr || transaction.mode !== expectedMode) {
    throw new Error("unsupported transaction");
  }

  const stakesWithMeta = useSolanaStakesWithMeta(account.currency, account.stakingResources);
  const stakeWithMeta = stakesWithMeta.find(s => s.stake.positionId === stakeAccAddr);
  if (stakeWithMeta === undefined) {
    throw new Error(`stake with account address <${stakeAccAddr}> not found`);
  }

  const validators = useValidators(account.currency);
  const { stake } = stakeWithMeta;

  return {
    unit,
    stake,
    validator: validators.find(v => v.voteAccount === stake.validatorAddress),
  };
}
