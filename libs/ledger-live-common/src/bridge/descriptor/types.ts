import type { AccountLike } from "@ledgerhq/types-live";
import type { SendDescriptor } from "@features/platform-send-flow/descriptor";

export type {
  BalanceTypeConfig,
  BalanceTypeOption,
  BalanceTypeSelfTransferTarget,
  CoinControlBuildStrategyChangePatchParams,
  CoinControlBuildToggleRowExclusionPatchParams,
  CoinControlConfig,
  CoinControlDisplayData,
  CoinControlGetDisplayDataParams,
  CoinControlPickingStrategyOption,
  CoinControlUtxoRow,
  CustomFeeConfig,
  CustomFeeInputDescriptor,
  CustomFeeInputValueTransform,
  ErrorRegistry,
  FeeAssetContext,
  FeeAssetOption,
  FeeAssetsConfig,
  FeeDescriptor,
  FeePresetEstimationDescriptor,
  FeePresetOption,
  FeeUnitLabel,
  FlowEffect,
  FlowEffectContext,
  InputDescriptor,
  InputFieldType,
  MemoType,
  NetworkFeesInfo,
  SelfTransferPolicy,
  SendAmountDescriptor,
  SendDescriptor,
  TransactionPatch,
} from "@features/platform-send-flow/descriptor";

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
  /**
   * Account-level analytics attributes, added to events about that account. Declared per
   * coin; generic callers never inspect the account themselves. Never returns keys,
   * addresses or balances.
   */
  getAccountTrackingAttributes?: (account: AccountLike) => Record<string, string | boolean>;
  /**
   * User-level analytics attributes, computed over all the user's accounts. Every coin
   * receives every account and keeps its own. Never returns keys, addresses or balances.
   */
  getUserTrackingAttributes?: (accounts: AccountLike[]) => Record<string, number>;
};
