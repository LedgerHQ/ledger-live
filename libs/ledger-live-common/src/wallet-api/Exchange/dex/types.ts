import type BigNumber from "bignumber.js";

/**
 * Native DEX provider ids the wallet can build calldata for via the swap-api.
 *
 * Kept in sync with the live-app `dexDataBuilders.ts` registry. RFQ-style
 * providers (`uniswapfusion`, `oneinchfusion`) sit outside this set because
 * they take a different submit-and-poll flow.
 */
export const DEX_PROVIDERS = ["uniswap", "oneinch", "velora", "okx"] as const;
export type DexProvider = (typeof DEX_PROVIDERS)[number];

const DEX_PROVIDER_SET: ReadonlySet<string> = new Set(DEX_PROVIDERS);

export function isDexProvider(value: string): value is DexProvider {
  return DEX_PROVIDER_SET.has(value);
}

/**
 * Provider-agnostic transaction blob returned by the swap-api DEX endpoints.
 * Consumers feed it straight into the EVM bridge or device-intent signer.
 */
export interface DexTransactionData {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
}

/**
 * Inputs every DEX builder shares. Each builder destructures only the
 * fields it actually needs so the caller does not have to know which
 * fields are provider-specific.
 */
export interface DexBuildContext {
  customFields?: Record<string, unknown>;
  permitSignature?: string;
  fromCurrencyId: string | undefined;
  toCurrencyId: string | undefined;
  fromAccountAddress: string | undefined;
  amountFrom: BigNumber;
  slippage: number;
  gasLimitMultiplier: number;
  defaultGasLimit: string;
}

/**
 * Output of a provider DEX builder: the transaction blob plus the
 * device app name and partner tag the wallet uses for analytics and
 * for picking the right embedded app.
 */
export interface DexProviderTransactionData {
  transactionData: DexTransactionData;
  appName: string;
  partner: string;
}
