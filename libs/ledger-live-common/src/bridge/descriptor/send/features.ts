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
    return d ? (getter(d) ?? fallback) : fallback;
  };
}

export const sendFeatures = {
  canSendMax: fromDescriptor(d => d.amount?.canSendMax, true),
  hasMemo: fromDescriptor(d => d.inputs.memo != null, false),
  hasFeePresets: fromDescriptor(d => d.fees.hasPresets, false),
  hasCustomFees: fromDescriptor(d => d.fees.hasCustom, false),
  getCustomFeeConfig: fromDescriptor(d => d.fees.custom, null as CustomFeeConfig | null),
  hasCustomAssets: fromDescriptor(d => d.fees.hasCustomAssets, false),
  getCustomAssetsConfig: fromDescriptor(d => d.fees.customAssets, null as FeeAssetsConfig | null),
  hasCoinControl: fromDescriptor(d => d.fees.hasCoinControl, false),
  getCoinControlConfig: fromDescriptor(d => d.fees.coinControl, null as CoinControlConfig | null),
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
  getAmountPlugins: fromDescriptor(d => d.amount?.getPlugins?.(), [] as readonly string[]),
  getFeeCurrencyAccountId: (
    currency: CryptoOrTokenCurrency | undefined,
    transaction: unknown,
  ): string | null => {
    const d = getSendDescriptor(currency);
    return d?.fees.getFeeCurrencyAccountId?.(transaction) ?? null;
  },
  getMemoType: fromDescriptor(d => d.inputs.memo?.type, undefined),
  getMemoMaxLength: fromDescriptor(d => d.inputs.memo?.maxLength, undefined),
  getMemoMaxValue: fromDescriptor(d => d.inputs.memo?.maxValue, undefined),
  getMemoOptions: fromDescriptor(d => d.inputs.memo?.options, undefined),
  getMemoDefaultOption: fromDescriptor(d => d.inputs.memo?.defaultOption, undefined),
  supportsDomain: fromDescriptor(d => d.inputs.recipientSupportsDomain, false),
  getSelfTransferPolicy: fromDescriptor(d => d.selfTransfer, "impossible" as SelfTransferPolicy),
  getUserRefusedTransactionErrorName: fromDescriptor(
    d => d.errors?.userRefusedTransaction,
    "TransactionRefusedOnDevice",
  ),
  isUserRefusedTransactionError: (
    currency: CryptoOrTokenCurrency | undefined,
    error: unknown,
  ): boolean => {
    if (!currency) return false;
    const errorName = sendFeatures.getUserRefusedTransactionErrorName(currency);
    return (
      error !== null && typeof error === "object" && "name" in error && error.name === errorName
    );
  },
};
