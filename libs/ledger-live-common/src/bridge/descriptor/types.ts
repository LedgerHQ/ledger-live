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

export type CustomFeeInputValueTransform = Readonly<{
  /** Restrict the transform to specific custom fee input keys. Applies to all inputs when omitted. */
  inputKeys?: readonly string[];
  /** Converts descriptor-native values to values displayed in the input. */
  fromCanonicalValue: (value: string) => string;
  /** Converts user-entered values back to descriptor-native values. */
  toCanonicalValue: (value: string) => string;
}>;

/**
 * A single selectable fee-paying asset displayed in the "Pay fees in" control
 * of the Custom Fees step (e.g. native CELO or an allowlisted token).
 */
export type FeeAssetOption = Readonly<{
  id: string;
  ticker: string;
  label: string;
  /** Unit label to display in the fee input when this asset is selected (ex: "Gwei", "sat") */
  unitLabel?: string;
  /** Optional conversion between descriptor-native fee values and selected-asset display values. */
  customFeeInputValueTransform?: CustomFeeInputValueTransform;
  /** Currency for the leading icon; the coin-module already has it resolved (no async lookup needed). */
  currency?: CryptoOrTokenCurrency;
  /** Raw held balance in the currency's smallest (atomic) unit; the UI formats it with `currency.units[0]` and the user's locale. */
  balance?: BigNumber;
}>;

/**
 * Context handed to a fee asset config. Exposes the resolved main account (so a
 * config can read sub-accounts, balances, ...) and the current transaction.
 * `transaction` is intentionally `unknown`: the owning coin-module narrows it,
 * the generic UI never reads it.
 */
export type FeeAssetContext = Readonly<{
  mainAccount: Account;
  transaction: unknown;
}>;

/**
 * Declarative, family agnostic configuration for coins that let users pay fees
 * with an alternative asset/token (e.g. Celo's fee abstraction). The coin-module
 * owns the options, the selected value and the resulting opaque transaction
 * patch; the generic Custom Fees UI only renders the "Pay fees in" select and
 * forwards the user's choice — no coin code lives in the apps.
 */
export type FeeAssetsConfig = Readonly<{
  /** Computes the selectable fee assets from the current account/transaction. */
  getOptions: (context: FeeAssetContext) => readonly FeeAssetOption[];
  /** Resolves the currently-selected option id from the transaction. */
  getSelectedOptionId: (context: FeeAssetContext) => string;
  /** Builds an opaque transaction patch for the chosen option, or `null`. */
  buildPatch: (optionId: string, context: FeeAssetContext) => TransactionPatch | null;
  /**
   * Optional reconciliation run by the generic UI when the account/transaction
   * change. Returns a patch to apply when the current selection became invalid
   * (e.g. the selected sub-account disappeared), or `null` to leave it as-is.
   */
  reconcile?: (context: FeeAssetContext) => TransactionPatch | null;
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
 * Family-agnostic content for the network-fees info affordance (tooltip/drawer): an i18n key
 * *suffix* (each app prepends its namespace and appends `.title` and/or `.description`) plus
 * interpolation values, mirroring the `fees.${presetId}` pattern so coin logic stays out of the apps.
 */
export type NetworkFeesInfo = Readonly<{
  /** i18n key suffix; the UI prepends its namespace and appends `.title` and/or `.description`. */
  translationKey: string;
  /** Interpolation values for the resolved translations. */
  values?: Record<string, string | number>;
}>;

/**
 * Fee input options
 */
export type FeeDescriptor = {
  hasPresets: boolean;
  hasCustom: boolean;
  hasCustomAssets?: boolean;
  hasCoinControl?: boolean;
  /**
   * Opt-in: also display the fee amount in its own fee currency (native) next to the fiat value on
   * the Amount fee row, and render `0` explicitly instead of the `"-"` sentinel for a zero fee. Off
   * by default (fiat value, with a native-amount fallback). Independent of `getNetworkFeesInfo`.
   */
  showFeeCurrencyAmount?: boolean;
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
   * to pay transaction fees (e.g. Celo's fee abstraction tokens) and how the
   * selection maps to an opaque transaction patch.
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
  /** Family-specific network-fees explanation derived from the tx status; `null` ⇒ generic copy. */
  getNetworkFeesInfo?: (ctx: { transaction: unknown; status: unknown }) => NetworkFeesInfo | null;
  /** Declares a single network-estimated fee for coins with no user-selectable presets (slow/med/fast)
   * but with custom fees. Lets the user return from a custom override to the network default. Intended
   * for preset-less + custom coins; the coin-module owns the revert patch (which override fields to clear). */
  defaultStrategy?: { buildTransactionPatch: () => TransactionPatch };
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
