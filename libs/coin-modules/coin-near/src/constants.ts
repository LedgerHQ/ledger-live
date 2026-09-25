export const FALLBACK_STORAGE_AMOUNT_PER_BYTE = "10000000000000000000";
export const NEW_ACCOUNT_SIZE = 182;
export const MIN_ACCOUNT_BALANCE_BUFFER = "50000000000000000000000";
/**
 * Gas attached to every staking-pool call (stake, unstake, withdraw). The heaviest path a
 * poolv1 call takes is the first call in a new epoch, when `internal_ping` restakes: the call
 * itself, a Transfer or Stake receipt, and the pool's `on_stake_action` callback, which the
 * contract reserves 20 TGas for at promise creation. Measured on mainnet across five pools: at
 * most 13.64 TGas actually charged on that path, and 30 TGas attached succeeds on it, which is
 * what other wallets send. 50 TGas leaves the full callback reservation again as headroom.
 */
export const STAKING_GAS = "50000000000000";
/**
 * Margin added on top of the attached gas when pricing a staking call. The chain charges the
 * attached gas plus the action's own send/exec/receipt fees; those measured 0.92 TGas at the
 * floor price on a real withdraw_all, so 5 TGas keeps the quote above the charge.
 */
export const STAKING_FEE_OVERHEAD_GAS = "5000000000000";
export const FIGMENT_NEAR_VALIDATOR_ADDRESS = "ledgerbyfigment.poolv1.near";
export const FRACTIONAL_DIGITS = 5;
/** How many staking pools to surface; the indexer orders them by stake, so this is the top N. */
export const VALIDATORS_COUNT = 200;
export const YOCTO_THRESHOLD_VARIATION = "10";
export const NEAR_DUMMY_ADDRESS =
  "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";
