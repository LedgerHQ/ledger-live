import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { getCurrencyBridge } from "./impl";
import { descriptor as algorandDescriptor } from "../families/algorand/descriptor";
import { descriptor as aptosDescriptor } from "../families/aptos/descriptor";
import { descriptor as bitcoinDescriptor } from "../families/bitcoin/descriptor";
import { descriptor as cantonDescriptor } from "../families/canton/descriptor";
import { descriptor as cardanoDescriptor } from "../families/cardano/descriptor";
import { descriptor as casperDescriptor } from "../families/casper/descriptor";
import { descriptor as celoDescriptor } from "../families/celo/descriptor";
import { descriptor as cosmosDescriptor } from "../families/cosmos/descriptor";
import { descriptor as evmDescriptor } from "../families/evm/descriptor";
import { descriptor as filecoinDescriptor } from "../families/filecoin/descriptor";
import { descriptor as hederaDescriptor } from "../families/hedera/descriptor";
import { descriptor as iconDescriptor } from "../families/icon/descriptor";
import { descriptor as internetComputerDescriptor } from "../families/internet_computer/descriptor";
import { descriptor as kaspaDescriptor } from "../families/kaspa/descriptor";
import { descriptor as minaDescriptor } from "../families/mina/descriptor";
import { descriptor as multiversxDescriptor } from "../families/multiversx/descriptor";
import { descriptor as nearDescriptor } from "../families/near/descriptor";
import { descriptor as polkadotDescriptor } from "../families/polkadot/descriptor";
import { descriptor as solanaDescriptor } from "../families/solana/descriptor";
import { descriptor as stacksDescriptor } from "../families/stacks/descriptor";
import { descriptor as stellarDescriptor } from "../families/stellar/descriptor";
import { descriptor as suiDescriptor } from "../families/sui/descriptor";
import { descriptor as tezosDescriptor } from "../families/tezos/descriptor";
import { descriptor as tonDescriptor } from "../families/ton/descriptor";
import { descriptor as tronDescriptor } from "../families/tron/descriptor";
import { descriptor as vechainDescriptor } from "../families/vechain/descriptor";
import { descriptor as xrpDescriptor } from "../families/xrp/descriptor";

/**
 * Memo field type configuration
 */
export type MemoType =
  | "text" // Simple text memo (cosmos, solana, algorand)
  | "tag" // Numeric tag (xrp destination tag, casper transfer id)
  | "typed"; // Typed memo with predefined options (stellar)

/**
 * Input field types for descriptors
 */
export type InputFieldType = "text" | "number" | "tag" | "typed";

/**
 * Input field descriptor for a transaction flow
 */
export type InputDescriptor = Readonly<{
  type: InputFieldType;
  maxLength?: number;
  maxValue?: number;
  options?: readonly string[];
  defaultOption?: string;
  supportsDomain?: boolean; // Whether the field supports domain names (ENS for EVM)
}>;

/**
 * Descriptor for a single custom fee input field
 */
export type CustomFeeInputDescriptor = Readonly<{
  /** Transaction field key, eg. "maxFeePerGas", "feePerByte" */
  key: string;
  /** Input type (currently only "number") */
  type: "number";
  /** Display unit for the input, e.g. "Gwei", "sat/vbyte" */
  unitLabel: string;
  /** Optional suggested range displayed below the input */
  suggestedRange?: {
    getRange: (transaction: unknown) => { min: string; max: string } | null;
  };
  /** Optional helper info displayed below the input (e.g. "Next block: 0 Gwei") */
  helperInfo?: {
    getValue: (transaction: unknown) => string | null;
  };
}>;

/**
 * Configuration for custom fee inputs.
 * Describes which fields to render and how to read/write transaction values.
 */
export type CustomFeeConfig = Readonly<{
  /** List of input fields to render in the custom fees dialog */
  inputs: readonly CustomFeeInputDescriptor[];
  /** Extract initial values from the current transaction */
  getInitialValues: (transaction: unknown) => Record<string, string>;
  /** Build a transaction patch from the user-entered values */
  buildTransactionPatch: (values: Record<string, string>) => Record<string, unknown>;
}>;

/**
 * Fee input options
 */
export type FeeDescriptor = {
  hasPresets: boolean;
  hasCustom: boolean;
  hasCoinControl?: boolean;
  presets?: {
    /**
     * Optional UI legend for presets (ex: fee rate like `2 sat/vbyte`).
     * Descriptor describes how to display it; UI layer provides the actual values (from presetAmount).
     */
    legend?: {
      type: "none" | "feeRate";
      unit: string;
      valueFrom: "presetAmount";
    };
    /**
     * Controls how the selected preset is labeled in the Amount row.
     * - i18n: `Slow/Medium/Fast` via translations
     * - legend: use the computed preset legend (ex: `2 sat/vbyte`)
     */
    strategyLabelInAmount?: "i18n" | "legend";

    /**
     * Optional builder for fee preset options. This allows coin-specific logic
     * to live in descriptors instead of UI-level `family` checks.
     */
    getOptions?: (transaction: unknown) => readonly FeePresetOption[];

    /**
     * Whether fiat estimation for presets should be done via bridge estimation
     * (`prepareTransaction` + `getTransactionStatus`) instead of using `presetAmount` directly.
     */
    shouldEstimateWithBridge?: (transaction: unknown) => boolean;
  };
  /**
   * Configuration for custom fee inputs.
   * When `hasCustom` is true, this describes which input fields to show
   * in the Custom Fees dialog and how to map them to transaction fields.
   */
  custom?: CustomFeeConfig;
};

export type FeePresetOption = Readonly<{
  id: string;
  amount: BigNumber;
  estimatedMs?: number;
  disabled?: boolean;
}>;

export type SendAmountDescriptor = Readonly<{
  /**
   * Optional list of plugins that should run on the Amount step.
   * These are executed by the UI layer through a plugin registry.
   */
  getPlugins?: () => readonly string[];
  canSendMax?: boolean;
}>;

/**
 * Self-transfer policy for a coin
 */
export type SelfTransferPolicy = "free" | "warning" | "impossible";

/**
 * Error registry for coin-specific error classes
 */
export type ErrorRegistry = {
  userRefusedTransaction?: string; // Error class name for when user refuses transaction on device
};

/**
 * Send flow descriptor defining inputs for the send transaction
 */
export type SendDescriptor = {
  inputs: {
    recipientSupportsDomain?: boolean; // Whether recipient field supports domain names (ENS for EVM)
    memo?: InputDescriptor;
  };
  fees: FeeDescriptor;
  amount?: SendAmountDescriptor;
  selfTransfer?: SelfTransferPolicy; // Policy for sending to self (same address), defaults to "impossible"
  errors?: ErrorRegistry; // Registry of error class names for this coin
};

/**
 * Complete flow descriptors for a coin
 */
export type CoinDescriptor = {
  send: SendDescriptor;
  // Future: stake, swap, etc.
};

type MemoApplicationFn = (
  memoValue: string | number | undefined,
  currentTransaction: Record<string, unknown>,
) => Record<string, unknown>;

const descriptorRegistry: Record<string, CoinDescriptor> = {
  algorand: algorandDescriptor,
  aptos: aptosDescriptor,
  bitcoin: bitcoinDescriptor,
  canton: cantonDescriptor,
  cardano: cardanoDescriptor,
  casper: casperDescriptor,
  celo: celoDescriptor,
  cosmos: cosmosDescriptor,
  evm: evmDescriptor,
  filecoin: filecoinDescriptor,
  hedera: hederaDescriptor,
  icon: iconDescriptor,
  internet_computer: internetComputerDescriptor,
  kaspa: kaspaDescriptor,
  mina: minaDescriptor,
  multiversx: multiversxDescriptor,
  near: nearDescriptor,
  polkadot: polkadotDescriptor,
  solana: solanaDescriptor,
  stacks: stacksDescriptor,
  stellar: stellarDescriptor,
  sui: suiDescriptor,
  tezos: tezosDescriptor,
  ton: tonDescriptor,
  tron: tronDescriptor,
  vechain: vechainDescriptor,
  xrp: xrpDescriptor,
};

/**
 * Get the full descriptor for a given currency via the CurrencyBridge
 */
export function getDescriptor(currency: CryptoOrTokenCurrency | undefined): CoinDescriptor | null {
  if (!currency) {
    return null;
  }

  const cryptoCurrency = currency.type === "TokenCurrency" ? currency.parentCurrency : currency;
  const bridge = getCurrencyBridge(cryptoCurrency);

  // Check if bridge implements getDescriptor directly
  if ("getDescriptor" in bridge && typeof bridge.getDescriptor === "function") {
    return bridge.getDescriptor(cryptoCurrency) as CoinDescriptor;
  }

  // Fallback: use the descriptor registry and check feature flags
  const fullDescriptor = descriptorRegistry[cryptoCurrency.family];
  if (fullDescriptor) {
    return fullDescriptor;
  }

  return null;
}

/**
 * Get the send flow descriptor for a given currency
 */
export function getSendDescriptor(
  currency: CryptoOrTokenCurrency | undefined,
): SendDescriptor | null {
  const descriptor = getDescriptor(currency);
  return descriptor?.send ?? null;
}

/**
 * Helper functions to check send flow capabilities
 */
const memoApplicationRegistry: Record<string, MemoApplicationFn> = {
  solana: (memo, transaction) => {
    const currentModel = (transaction.model as Record<string, unknown> | undefined) || {};
    const currentUiState = (currentModel.uiState as Record<string, unknown> | undefined) || {};
    return {
      model: {
        ...currentModel,
        uiState: {
          ...currentUiState,
          memo,
        },
      },
    };
  },
  casper: memo => ({ transferId: memo }),
  xrp: memo => {
    if (typeof memo === "number") return { tag: memo };
    if (typeof memo === "string") return { tag: Number(memo) };
    return { tag: undefined };
  },
  stellar: memo => ({ memoValue: memo }),
  ton: (memo, transaction) => {
    const currentComment = (transaction.comment as Record<string, unknown> | undefined) || {};
    return {
      comment: {
        ...currentComment,
        text: memo,
      },
    };
  },
};

export function applyMemoToTransaction(
  family: string,
  memoValue: string | number | undefined,
  currentTransaction: Record<string, unknown> = {},
): Record<string, unknown> {
  const applyFn = memoApplicationRegistry[family];
  if (!applyFn) {
    return { memo: memoValue };
  }
  return applyFn(memoValue, currentTransaction);
}

export const sendFeatures = {
  canSendMax: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.amount?.canSendMax !== false;
  },
  hasMemo: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo !== undefined;
  },
  hasFeePresets: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasPresets ?? false;
  },
  hasCustomFees: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasCustom ?? false;
  },
  getCustomFeeConfig: (currency: CryptoOrTokenCurrency | undefined): CustomFeeConfig | null => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.custom ?? null;
  },
  hasCoinControl: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.hasCoinControl ?? false;
  },
  getFeePresetOptions: (
    currency: CryptoOrTokenCurrency | undefined,
    transaction: unknown,
  ): readonly FeePresetOption[] => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.presets?.getOptions?.(transaction) ?? [];
  },
  shouldEstimateFeePresetsWithBridge: (
    currency: CryptoOrTokenCurrency | undefined,
    transaction: unknown,
  ): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.fees.presets?.shouldEstimateWithBridge?.(transaction) ?? false;
  },
  getAmountPlugins: (currency: CryptoOrTokenCurrency | undefined): readonly string[] => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.amount?.getPlugins?.() ?? [];
  },
  getMemoType: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.type;
  },
  getMemoMaxLength: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.maxLength;
  },
  getMemoMaxValue: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.maxValue;
  },
  getMemoOptions: (currency: CryptoOrTokenCurrency | undefined) => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.options;
  },
  getMemoDefaultOption: (currency: CryptoOrTokenCurrency | undefined): string | undefined => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.memo?.defaultOption;
  },
  supportsDomain: (currency: CryptoOrTokenCurrency | undefined): boolean => {
    const descriptor = getSendDescriptor(currency);
    return descriptor?.inputs.recipientSupportsDomain ?? false;
  },
  getSelfTransferPolicy: (currency: CryptoOrTokenCurrency | undefined): SelfTransferPolicy => {
    const descriptor = getSendDescriptor(currency);
    // Default to "impossible" if not specified
    return descriptor?.selfTransfer ?? "impossible";
  },
  getUserRefusedTransactionErrorName: (currency: CryptoOrTokenCurrency | undefined): string => {
    const descriptor = getSendDescriptor(currency);
    // Default to TransactionRefusedOnDevice if not specified
    return descriptor?.errors?.userRefusedTransaction ?? "TransactionRefusedOnDevice";
  },
  isUserRefusedTransactionError: (
    currency: CryptoOrTokenCurrency | undefined,
    error: unknown,
  ): boolean => {
    if (!currency) {
      return false;
    }
    const errorName = sendFeatures.getUserRefusedTransactionErrorName(currency);
    // Check if error is an instance of the registered error class by name
    return (
      error !== null && typeof error === "object" && "name" in error && error.name === errorName
    );
  },
};
