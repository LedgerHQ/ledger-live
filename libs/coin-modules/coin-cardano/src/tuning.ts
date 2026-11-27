import type { CardanoCoinConfig } from "./config";
import { CardanoInvalidConfigError } from "./errors";

/**
 * Ledger by Figment 1 to 4. A module constant rather than a registered default: LiveConfig merges
 * arrays by index, so a shorter remote list would keep the tail of a registered one.
 */
export const LEDGER_VALIDATORS: readonly string[] = [
  "a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6",
  "4a9c9902c9538da900b10b716d5d1b214487455fdb06028b32ffa180",
  "c726c9da5615d5f9f6858c25bb13f81c4741eccd08ce32f3414f323f",
  "1f550e7b0c9ec67887859b182af4b8e8e08c1728c47344f2deb9424c",
];

function integer(field: string, value: unknown, min: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= min) return value;
  throw new CardanoInvalidConfigError(
    `cardano: coin config ${field} must be an integer >= ${min}, got ${String(value)}`,
  );
}

/** For a ratio or a page size: zero would silence the warning or request nothing. */
export const positiveInt = (field: string, value: unknown): number => integer(field, value, 1);

export const nonNegativeInt = (field: string, value: unknown): number => integer(field, value, 0);

/** Both thresholds in lovelace. A warning above the error threshold could never show, so it throws. */
export const getMaxFees = (config: CardanoCoinConfig): { warning: number; error: number } => {
  const warning = nonNegativeInt("maxFeesWarning", config.maxFeesWarning);
  const error = nonNegativeInt("maxFeesError", config.maxFeesError);
  if (warning > error) {
    throw new CardanoInvalidConfigError(
      `cardano: coin config maxFeesWarning (${warning}) must not exceed maxFeesError (${error})`,
    );
  }
  return { warning, error };
};

export const getFeeTooHighRatio = (config: CardanoCoinConfig): bigint =>
  BigInt(positiveInt("fees.tooHighRatio", config.fees?.tooHighRatio));

export const getValidatorsBatchSize = (config: CardanoCoinConfig): number =>
  positiveInt("validators.batchSize", config.validators?.batchSize);

/** The configured pool ids, or {@link LEDGER_VALIDATORS} when none are configured. */
export const getLedgerValidators = (config: CardanoCoinConfig): readonly string[] => {
  const validators: unknown = config.staking?.ledgerValidators;
  if (validators === undefined) return LEDGER_VALIDATORS;
  if (
    Array.isArray(validators) &&
    validators.length > 0 &&
    validators.every(id => typeof id === "string" && id !== "")
  ) {
    return validators;
  }
  throw new CardanoInvalidConfigError(
    `cardano: coin config staking.ledgerValidators must be a non-empty list of pool ids, got ${JSON.stringify(validators)}`,
  );
};
