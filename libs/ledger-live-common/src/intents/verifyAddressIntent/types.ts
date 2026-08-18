import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export type VerifyAddressIntentJobState =
  | { type: "pending"; deviceModelId: DeviceModelId; address: string }
  | { type: "verified"; address: string }
  | { type: "cancelled"; retry: () => void }
  | { type: "unsupported"; error: Error };

export type VerifyAddressIntentInput = {
  account: AccountLike;
  parentAccount?: Account | null;
  /** Optional derivation path override; defaults to the account's fresh address path. */
  path?: string;
};

export type VerifyAddressIntentDefinition = IntentDefinition<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput
>;

export type VerifyAddressIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<VerifyAddressIntentJobState, VerifyAddressIntentInput, ExtraProps>;

export type VerifyAddressIntent<ExtraProps = undefined> = Intent<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput,
  ExtraProps
>;
