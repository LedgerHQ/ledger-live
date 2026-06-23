import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../coin-modules/transaction-types";

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

export type FeeUnitLabel = string | ((currency: CryptoOrTokenCurrency) => string | undefined);

/**
 * Descriptor for a single custom fee input field
 */
export type CustomFeeInputDescriptor = Readonly<{
  /** Transaction field key, eg. "maxFeePerGas", "feePerByte" */
  key: string;
  /** Input type (currently only "number") */
  type: "number";
  /** Display unit for the input, e.g. "Gwei", "sat/vbyte". Omit for unitless fields (e.g. gas limit). */
  unitLabel?: FeeUnitLabel;
  /** Optional suggested range displayed below the input */
  suggestedRange?: {
    getRange: (transaction: unknown) => { min: string; max: string } | null;
  };
  /** Optional helper info displayed below the input (e.g. "Next block: 0 Gwei") */
  helperInfo?: {
    getValue: (transaction: unknown) => string | null;
  };
  /** Optional minimum value constraint (e.g. system-estimated gas limit) */
  minValue?: {
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
 * Option for a fee-paying asset (for Celo WIP)
 */
export type FeeAssetOption = Readonly<{
  id: string;
  ticker: string;
  label: string;
  /** Unit label to display in the fee input when this asset is selected (ex: "Gwei", "sat") */
  unitLabel?: string;
}>;

/**
 * Configuration for coins that support paying fees with alternative assets/tokens.
 */
export type FeeAssetsConfig = Readonly<{
  options: readonly FeeAssetOption[];
  defaultId: string;
}>;

export type FeePresetOption = Readonly<{
  id: string;
  amount: BigNumber;
  estimatedMs?: number;
  disabled?: boolean;
}>;

export type FeePresetEstimationDescriptor = Readonly<{
  /**
   * Preset ids to estimate through the bridge when concrete preset amounts are
   * not available yet on the transaction
   */
  fallbackPresetIds?: readonly string[];
  /**
   * Some families can estimate fees before an amount is entered
   */
  allowZeroAmount?: boolean | ((transaction: unknown) => boolean);
}>;

/** Strategy option for coin control (i18n key resolved by the UI layer). */
export type CoinControlPickingStrategyOption = Readonly<{
  value: number;
  labelKey: string;
}>;

/** Single spendable coin row in the coin control list (family-agnostic). */
export type CoinControlUtxoRow = Readonly<{
  /** Stable key for React lists and toggle targeting (coin-specific encoding). */
  rowKey: string;
  titleLabel: string;
  formattedValue: string;
  excluded: boolean;
  exclusionReason: "pickPendingUtxo" | "userExclusion" | undefined;
  isUsedInTx: boolean;
  unconfirmed: boolean;
  disabled: boolean;
  confirmations: number;
}>;

export type CoinControlDisplayData = Readonly<{
  pickingStrategyOptions: readonly CoinControlPickingStrategyOption[];
  pickingStrategyValue: number;
  totalExcludedUTXOS: number;
  totalSpent: BigNumber;
  utxoRows: readonly CoinControlUtxoRow[];
}>;

export type CoinControlGetDisplayDataParams = Readonly<{
  account: AccountLike;
  transaction: unknown;
  status: unknown;
  locale: string;
}>;

export type CoinControlBuildStrategyChangePatchParams = Readonly<{
  transaction: unknown;
  strategy: number;
  displayData: CoinControlDisplayData | null;
}>;

export type CoinControlBuildToggleRowExclusionPatchParams = Readonly<{
  transaction: unknown;
  rowKey: string;
  displayData: CoinControlDisplayData | null;
}>;

/**
 * Coin-specific coin control: UTXO list, strategy selector, and transaction patches.
 * Implemented per family (e.g. Bitcoin) and attached to `FeeDescriptor.coinControl`.
 */
export type CoinControlConfig = Readonly<{
  customStrategyValue: number;
  getDisplayData: (params: CoinControlGetDisplayDataParams) => CoinControlDisplayData | null;
  buildStrategyChangePatch: (
    params: CoinControlBuildStrategyChangePatchParams,
  ) => Partial<Transaction> | null;
  buildToggleRowExclusionPatch: (
    params: CoinControlBuildToggleRowExclusionPatchParams,
  ) => Partial<Transaction> | null;
}>;

/**
 * Fee input options
 */
export type FeeDescriptor = {
  hasPresets: boolean;
  hasCustom: boolean;
  hasCustomAssets?: boolean;
  hasCoinControl?: boolean;
  presets?: {
    /**
     * Optional UI legend for presets (ex: fee rate like `2 sat/vbyte`).
     * Descriptor describes how to display it; UI layer provides the actual values (from presetAmount).
     */
    legend?: {
      type: "none" | "feeRate";
      unit: FeeUnitLabel;
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
    estimation?: FeePresetEstimationDescriptor;
  };
  /**
   * Configuration for custom fee inputs.
   * When `hasCustom` is true, this describes which input fields to show
   * in the Custom Fees dialog and how to map them to transaction fields.
   */
  custom?: CustomFeeConfig;
  /**
   * Configuration for fee asset selection.
   * When `hasCustomAssets` is true, this describes which assets can be used
   * to pay transaction fees (e.g. Celo's cUSD, cEUR).
   * (Not yet implemented)
   */
  customAssets?: FeeAssetsConfig;
  /** When `hasCoinControl` is true, describes rows and patches for the coin control step. */
  coinControl?: CoinControlConfig;
  /**
   * Optional accessor that exposes the sub-account id used to pay fees in a
   * non-native currency, or `null` when fees are paid in the parent account's
   * native currency. Lets the UI resolve the fee display unit without
   * inspecting `transaction.family`.
   */
  getFeeCurrencyAccountId?: (transaction: unknown) => string | null;
};

/**
 * Opaque transaction patch produced by a flow effect.
 *
 * family-agnostic: it carries no coin vocabulary (no gas, EVM,
 * UTXO, ...). The UI never reads it because it's forwarded as-is to
 * `bridge.updateTransaction`, which owns the concrete transaction shape
 */
export type TransactionPatch = Record<string, unknown>;

/**
 * Inputs handed to a flow effect when it runs.
 * The bridge is resolved generically by the runner, so an effect can perform a
 * bridge-backed preparation step without the UI ever importing a coin-module
 */
export type FlowEffectContext = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  bridge: AccountBridge<Transaction>;
}>;

/**
 * A declarative, family agnostic side effect owned by a coin-module descriptor
 * A single generic runner `useFlowEffects` executes the effect and applies the patch
 */
export type FlowEffect = Readonly<{
  /** Stable identifier */
  id: string;
  /**
   * Resolves with a transaction patch to apply, or `null` when nothing should
   * change. May be async: the family chunk is loaded through the bridge before
   * the patch is computed, so the runner owns the loading states
   */
  run: (context: FlowEffectContext) => Promise<TransactionPatch | null>;
}>;

export type SendAmountDescriptor = Readonly<{
  /**
   * Optional list of plugins that should run on the Amount step.
   * These are executed by the UI layer through a plugin registry.
   */
  getPlugins?: () => readonly string[];
  canSendMax?: boolean;
  /**
   * Generic and family agnostic effects executed by the `useFlowEffects` runner
   * while the Amount step is active. Each effect returns a transaction
   * patch applied through the `bridge.updateTransaction`
   */
  effects?: readonly FlowEffect[];
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
 * Delegation modes supported by a staking-capable coin
 */
export type StakeMode = "delegate" | "undelegate" | "redelegate";

/**
 * Staking flow descriptor: declares that a currency supports native delegation
 * and specifies which modes are available.
 */
export type StakeDescriptor = {
  supportedModes: readonly StakeMode[];
};

/**
 * Complete flow descriptors for a coin
 */
export type CoinDescriptor = {
  send: SendDescriptor;
  stake?: StakeDescriptor;
};
