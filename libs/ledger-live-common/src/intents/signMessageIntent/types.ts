import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";

export type SignMessageIntentJobState =
  | { type: "pending"; deviceModelId: DeviceModelId }
  | { type: "signed"; signature: string }
  | { type: "cancelled"; retry: () => void };

export type SignMessageIntentInput = {
  account: AccountLike;
  parentAccount?: Account | null;
  message: AnyMessage;
};

export type SignMessageIntentDefinition = IntentDefinition<
  SignMessageIntentJobState,
  SignMessageIntentInput
>;

export type SignMessageIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  SignMessageIntentJobState,
  SignMessageIntentInput,
  ExtraProps
>;

export type SignMessageIntent<ExtraProps = undefined> = Intent<
  SignMessageIntentJobState,
  SignMessageIntentInput,
  ExtraProps
>;
