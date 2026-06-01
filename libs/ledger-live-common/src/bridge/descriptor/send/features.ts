import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getSendDescriptor } from "../registry";
import type {
  CoinControlConfig,
  CustomFeeConfig,
  FeeAssetsConfig,
  FeePresetOption,
  SelfTransferPolicy,
  SendDescriptor,
} from "../types";

/** Builds a (currency) => T helper that reads from the send descriptor with a fallback when missing. */
function fromDescriptor<T>(
  getter: (d: SendDescriptor) => T | undefined | null,
  fallback: T,
): (currency: CryptoOrTokenCurrency | undefined) => T {
  return currency => {
    const d = getSendDescriptor(currency);
    return d ? getter(d) ?? fallback : fallback;
  };
}

const NO_CUSTOM_FEE_CONFIG: CustomFeeConfig | null = null;
const NO_CUSTOM_ASSETS_CONFIG: FeeAssetsConfig | null = null;
const NO_COIN_CONTROL_CONFIG: CoinControlConfig | null = null;
const NO_AMOUNT_PLUGINS: readonly string[] = [];
const NO_USER_REFUSED_STATUS_CODES: readonly string[] = [];
const DEFAULT_SELF_TRANSFER_POLICY: SelfTransferPolicy = "impossible";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStatusCode(statusCode: unknown): string | undefined {
  if (typeof statusCode === "string") {
    return statusCode.toLowerCase();
  }

  if (typeof statusCode === "number") {
    return statusCode.toString(16).toLowerCase();
  }
}

function hasUserRefusedStatusCode(error: unknown, statusCodes: readonly string[]): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const { errorCode, originalError } = error;
  const normalizedErrorCode = normalizeStatusCode(errorCode);

  if (normalizedErrorCode && statusCodes.some(code => code.toLowerCase() === normalizedErrorCode)) {
    return true;
  }

  return hasUserRefusedStatusCode(originalError, statusCodes);
}

export const sendFeatures = {
  canSendMax: fromDescriptor(d => d.amount?.canSendMax, true),
  hasMemo: fromDescriptor(d => d.inputs.memo != null, false),
  hasFeePresets: fromDescriptor(d => d.fees.hasPresets, false),
  hasCustomFees: fromDescriptor(d => d.fees.hasCustom, false),
  getCustomFeeConfig: fromDescriptor(d => d.fees.custom, NO_CUSTOM_FEE_CONFIG),
  hasCustomAssets: fromDescriptor(d => d.fees.hasCustomAssets, false),
  getCustomAssetsConfig: fromDescriptor(d => d.fees.customAssets, NO_CUSTOM_ASSETS_CONFIG),
  hasCoinControl: fromDescriptor(d => d.fees.hasCoinControl, false),
  getCoinControlConfig: fromDescriptor(d => d.fees.coinControl, NO_COIN_CONTROL_CONFIG),
  getFeePresetOptions: (
    currency: CryptoOrTokenCurrency | undefined,
    transaction: unknown,
  ): readonly FeePresetOption[] => {
    const d = getSendDescriptor(currency);
    return d?.fees.presets?.getOptions?.(transaction) ?? [];
  },
  shouldEstimateFeePresetsWithBridge: (
    currency: CryptoOrTokenCurrency | undefined,
    transaction: unknown,
  ): boolean => {
    const d = getSendDescriptor(currency);
    return d?.fees.presets?.shouldEstimateWithBridge?.(transaction) ?? false;
  },
  getAmountPlugins: fromDescriptor(d => d.amount?.getPlugins?.(), NO_AMOUNT_PLUGINS),
  getMemoType: fromDescriptor(d => d.inputs.memo?.type, undefined),
  getMemoMaxLength: fromDescriptor(d => d.inputs.memo?.maxLength, undefined),
  getMemoMaxValue: fromDescriptor(d => d.inputs.memo?.maxValue, undefined),
  getMemoOptions: fromDescriptor(d => d.inputs.memo?.options, undefined),
  getMemoDefaultOption: fromDescriptor(d => d.inputs.memo?.defaultOption, undefined),
  supportsDomain: fromDescriptor(d => d.inputs.recipientSupportsDomain, false),
  getSelfTransferPolicy: fromDescriptor(d => d.selfTransfer, DEFAULT_SELF_TRANSFER_POLICY),
  getUserRefusedTransactionErrorName: fromDescriptor(
    d => d.errors?.userRefusedTransaction,
    "TransactionRefusedOnDevice",
  ),
  getUserRefusedTransactionStatusCodes: fromDescriptor(
    d => d.errors?.userRefusedTransactionStatusCodes,
    NO_USER_REFUSED_STATUS_CODES,
  ),
  isUserRefusedTransactionError: (
    currency: CryptoOrTokenCurrency | undefined,
    error: unknown,
  ): boolean => {
    if (!currency) return false;
    const errorName = sendFeatures.getUserRefusedTransactionErrorName(currency);
    const statusCodes = sendFeatures.getUserRefusedTransactionStatusCodes(currency);
    return (
      (isRecord(error) && "name" in error && error.name === errorName) ||
      hasUserRefusedStatusCode(error, statusCodes)
    );
  },
};
