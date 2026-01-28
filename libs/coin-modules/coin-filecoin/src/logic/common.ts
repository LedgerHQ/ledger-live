/**
 * Filecoin transaction methods
 */
export enum Methods {
  Transfer = 0,
  ERC20Transfer = 1,
  InvokeEVM = 3844450837,
}

/**
 * Account types for Filecoin
 */
export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

/**
 * Bot test scenarios
 */
export enum BotScenario {
  DEFAULT = "default",
  ETH_RECIPIENT = "eth-recipient",
  F4_RECIPIENT = "f4-recipient",
  TOKEN_TRANSFER = "token-transfer",
}

/**
 * Calculate estimated fees from gas parameters (bigint version for API layer)
 * @param gasFeeCap - Maximum gas price per unit
 * @param gasLimit - Maximum gas units to consume
 * @returns Estimated total fees
 */
export function calculateEstimatedFees(gasFeeCap: bigint, gasLimit: bigint): bigint {
  return gasFeeCap * gasLimit;
}
