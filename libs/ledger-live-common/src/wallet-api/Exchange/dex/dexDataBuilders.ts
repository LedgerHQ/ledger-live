/**
 * Provider-specific functions that fetch transaction data from swap APIs.
 *
 * Ported from the swap-live-app `executeSwap/dexDataBuilders.ts` so the
 * wallet-side DEX execution path can build the same calldata without
 * re-fetching quotes. Each builder receives a common context and
 * internally extracts only the parameters it cares about.
 */
import { getAdjustedGasLimit } from "./gasLimitAdjusted";
import { getOkxTransaction } from "./swap-api/okx";
import { getOneinchTransaction, type OneInchSwapData } from "./swap-api/oneinch";
import { getUniswapTransaction } from "./swap-api/uniswap";
import {
  getVeloraTransaction,
  type VeloraPriceRoute,
  type VeloraSwapData,
} from "./swap-api/velora";
import {
  isDexProvider,
  type DexBuildContext,
  type DexProvider,
  type DexProviderTransactionData,
} from "./types";

/**
 * Narrows an arbitrary provider id to the native DEX subset the wallet
 * can build calldata for. The discriminant is the same `providerType`
 * field used by the live-app: only `DEX` rows go through this path.
 */
export function isDexExecutionProvider<T extends { provider: string; providerType?: string }>(
  quote: T,
): quote is T & { provider: DexProvider } {
  return quote.providerType === "DEX" && isDexProvider(quote.provider);
}

/**
 * Provider adapter for Uniswap quotes. The opaque `customFields` blob
 * carries everything Uniswap's swap endpoint needs (chain ids, token
 * addresses, route hints), so we forward it verbatim alongside the
 * Permit2 signature when one was produced.
 */
async function buildUniswapTransactionData(
  ctx: DexBuildContext,
): Promise<DexProviderTransactionData> {
  const { customFields, permitSignature, gasLimitMultiplier, defaultGasLimit } = ctx;

  const response = await getUniswapTransaction({
    customFields,
    permitSignature,
  });

  return {
    appName: "Uniswap",
    partner: "uniswap",
    transactionData: {
      to: response.swap.to,
      data: response.swap.data,
      value: response.swap.value,
      gasLimit: getAdjustedGasLimit(response.swap.gasLimit, gasLimitMultiplier, defaultGasLimit),
    },
  };
}

/**
 * Provider adapter for 1inch classic quotes. 1inch ignores `customFields`
 * and re-derives the swap from the context instead.
 */
async function buildOneinchTransactionData(
  ctx: DexBuildContext,
): Promise<DexProviderTransactionData> {
  const {
    fromCurrencyId,
    toCurrencyId,
    fromAccountAddress,
    amountFrom,
    slippage,
    gasLimitMultiplier,
    defaultGasLimit,
  } = ctx;

  const swapData: OneInchSwapData = {
    "@type": "OneInchSwapCustomFields",
    ledgerIdFrom: fromCurrencyId,
    ledgerIdTo: toCurrencyId,
    address: fromAccountAddress,
    amount: amountFrom,
    slippage,
  };

  const response = await getOneinchTransaction(swapData);

  return {
    appName: "1inch",
    partner: "oneinch",
    transactionData: {
      to: response.to,
      data: response.data,
      value: response.value,
      gasLimit: getAdjustedGasLimit(response.gasLimit, gasLimitMultiplier, defaultGasLimit),
    },
  };
}

/**
 * Provider adapter for Velora quotes. The route lives in `priceRoute`
 * on the quote's `customFields` and is opaque to this layer.
 */
async function buildVeloraTransactionData(
  ctx: DexBuildContext,
): Promise<DexProviderTransactionData> {
  const {
    fromCurrencyId,
    fromAccountAddress,
    amountFrom,
    slippage,
    customFields,
    gasLimitMultiplier,
    defaultGasLimit,
  } = ctx;

  const priceRoute = customFields?.priceRoute as VeloraPriceRoute | undefined;

  const swapData: VeloraSwapData = {
    "@type": "VeloraSwapCustomFields",
    ledgerIdFrom: fromCurrencyId,
    srcToken: priceRoute?.srcToken,
    destToken: priceRoute?.destToken,
    userAddress: fromAccountAddress,
    receiverAddress: fromAccountAddress,
    originAddress: null,
    amountFrom,
    slippage,
    priceRoute,
    swapResponse: null,
  };

  const response = await getVeloraTransaction(swapData);

  return {
    appName: "Velora",
    partner: "velora",
    transactionData: {
      to: response.to,
      data: response.data,
      value: String(response.value),
      gasLimit: getAdjustedGasLimit(response.gasLimit, gasLimitMultiplier, defaultGasLimit),
    },
  };
}

/**
 * Provider adapter for OKX DEX quotes. OKX's swap endpoint accepts the
 * raw `customFields` bag without further shaping.
 */
async function buildOkxTransactionData(ctx: DexBuildContext): Promise<DexProviderTransactionData> {
  const { customFields, gasLimitMultiplier, defaultGasLimit } = ctx;

  const response = await getOkxTransaction({ customFields });

  return {
    appName: "Ethereum",
    partner: "okx",
    transactionData: {
      to: response.to,
      data: response.data,
      value: String(response.value),
      gasLimit: getAdjustedGasLimit(response.gasLimit, gasLimitMultiplier, defaultGasLimit),
    },
  };
}

const DEX_TRANSACTION_BUILDERS: Record<
  DexProvider,
  (ctx: DexBuildContext) => Promise<DexProviderTransactionData>
> = {
  uniswap: buildUniswapTransactionData,
  oneinch: buildOneinchTransactionData,
  velora: buildVeloraTransactionData,
  okx: buildOkxTransactionData,
};

/**
 * Single entrypoint for DEX execution paths to obtain calldata for a
 * supported provider. Mirrors the swap-live-app `buildProviderTransactionData`
 * helper so behaviour stays in lockstep.
 */
export async function buildProviderTransactionData(
  provider: DexProvider,
  ctx: DexBuildContext,
): Promise<DexProviderTransactionData> {
  return await DEX_TRANSACTION_BUILDERS[provider](ctx);
}
