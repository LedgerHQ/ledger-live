import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";

export type GetAddressLegacyTransportCompatDemoIntentJobState =
  | { type: "deriving" }
  | { type: "gotTransport" }
  | { type: "completed"; address: string }
  | { type: "failed"; error: unknown };

export type GetAddressLegacyTransportCompatDemoIntentInput = {
  currencyId: string;
  path: string;
  derivationMode: string;
};

export type GetAddressLegacyTransportCompatDemoIntentExtraProps = Record<string, never>;

export type GetAddressLegacyTransportCompatDemoIntentDefinition = IntentDefinition<
  GetAddressLegacyTransportCompatDemoIntentJobState,
  GetAddressLegacyTransportCompatDemoIntentInput
>;

export type GetAddressLegacyTransportCompatDemoIntentPlatformDefinition = IntentPlatformDefinition<
  GetAddressLegacyTransportCompatDemoIntentJobState,
  GetAddressLegacyTransportCompatDemoIntentInput,
  GetAddressLegacyTransportCompatDemoIntentExtraProps
>;

export type GetAddressLegacyTransportCompatDemoIntent = Intent<
  GetAddressLegacyTransportCompatDemoIntentJobState,
  GetAddressLegacyTransportCompatDemoIntentInput,
  GetAddressLegacyTransportCompatDemoIntentExtraProps
>;
