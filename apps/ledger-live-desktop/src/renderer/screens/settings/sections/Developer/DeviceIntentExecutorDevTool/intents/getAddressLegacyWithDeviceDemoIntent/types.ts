import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type GetAddressLegacyWithDeviceDemoIntentJobState =
  | { type: "deriving" }
  | { type: "gotTransport" }
  | { type: "completed"; address: string }
  | { type: "failed"; error: unknown };

export type GetAddressLegacyWithDeviceDemoIntentInput = {
  currencyId: string;
  path: string;
  derivationMode: string;
};

export type GetAddressLegacyWithDeviceDemoIntentExtraProps = Record<string, never>;

export type GetAddressLegacyWithDeviceDemoIntentDefinition = IntentDefinition<
  GetAddressLegacyWithDeviceDemoIntentJobState,
  GetAddressLegacyWithDeviceDemoIntentInput
>;

export type GetAddressLegacyWithDeviceDemoIntentPlatformDefinition = IntentPlatformDefinition<
  GetAddressLegacyWithDeviceDemoIntentJobState,
  GetAddressLegacyWithDeviceDemoIntentInput,
  GetAddressLegacyWithDeviceDemoIntentExtraProps
>;

export type GetAddressLegacyWithDeviceDemoIntent = Intent<
  GetAddressLegacyWithDeviceDemoIntentJobState,
  GetAddressLegacyWithDeviceDemoIntentInput,
  GetAddressLegacyWithDeviceDemoIntentExtraProps
>;
