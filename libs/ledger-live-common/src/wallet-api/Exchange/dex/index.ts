/**
 * Wallet-side DEX execution helpers used by `custom.swap` device-intent
 * flows. The module mirrors the swap-live-app `executeSwap` DEX builders
 * so the wallet can fetch provider calldata, build an EVM transaction,
 * and sign it through the device intent stack without going back to the
 * live-app.
 */
export {
  buildProviderTransactionData,
  isDexExecutionProvider,
} from "./dexDataBuilders";
export {
  DEFAULT_DEX_GAS_LIMIT,
  DEFAULT_DEX_GAS_LIMIT_MULTIPLIER,
} from "./constants";
export { getAdjustedGasLimit } from "./gasLimitAdjusted";
export type {
  DexBuildContext,
  DexProvider,
  DexProviderTransactionData,
  DexTransactionData,
} from "./types";
