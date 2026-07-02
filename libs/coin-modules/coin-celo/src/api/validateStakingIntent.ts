import type {
  Balance,
  FeeEstimation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { estimateFees } from "./estimateFees";
import type { CeloStakingIntent, CeloStakingType } from "./stakingIntent";
import type { CeloFeeParameters } from "./types";

/** Staking operations that must target a validator group. */
const GROUP_OPERATIONS = new Set<CeloStakingType>([
  "celo.vote",
  "celo.activate",
  "celo.revokePending",
  "celo.revokeActive",
]);

/** Staking operations that move a caller-specified amount and thus require amount > 0. */
const AMOUNT_OPERATIONS = new Set<CeloStakingType>([
  "celo.lock",
  "celo.unlock",
  "celo.vote",
  "celo.revokePending",
  "celo.revokeActive",
]);

/**
 * Lean validation for a Celo staking intent: fee coverage, required-field
 * presence, and (for `lock`) native-amount coverage.
 *
 * Only `celo.lock` spends native CELO (`amount`); the other operations move
 * already-locked funds and cost only gas. When gas is paid in an ERC-20 (CIP-64)
 * the estimated fee is denominated in that token, not CELO, so it is excluded
 * from the native `totalSpent` and the native coverage check.
 *
 * Deeper checks (vote-cap, activation timing, unbonding readiness) are deferred.
 */
export const validateStakingIntent = async (
  intent: CeloStakingIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimation = customFees ?? (await estimateFees(intent));
  const estimatedFees = estimation.value;
  const feeCurrency = (estimation.parameters as CeloFeeParameters | undefined)?.feeCurrency;

  const nativeBalance = balances.find(balance => balance.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  const amount = intent.type === "celo.lock" ? intent.amount : 0n;
  const totalSpent = feeCurrency ? amount : amount + estimatedFees;

  if (GROUP_OPERATIONS.has(intent.type) && !(intent.valAddress ?? intent.recipient)) {
    errors.recipient = new Error(`celo: ${intent.type} requires a validator group (valAddress)`);
  }

  if (AMOUNT_OPERATIONS.has(intent.type) && intent.amount <= 0n) {
    errors.amount = new Error(`celo: ${intent.type} requires a positive amount`);
  } else if (totalSpent > available) {
    errors.amount = new Error("celo: insufficient CELO balance for this staking operation");
  }

  return { errors, warnings, estimatedFees, amount, totalSpent };
};

export default validateStakingIntent;
