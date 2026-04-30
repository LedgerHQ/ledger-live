import type {
  DeviceExtractedContext,
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@ledgerhq/device-intent";

export type InitializationEchoIntentJobState = {
  type: "contextReceived";
  deviceExtractedContext: DeviceExtractedContext;
};

export type InitializationEchoIntentInput = undefined;

export type InitializationEchoIntentExtraProps = Record<string, never>;

export type InitializationEchoIntentDefinition = IntentDefinition<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput
>;

export type InitializationEchoIntentPlatformDefinition = IntentPlatformDefinition<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput,
  InitializationEchoIntentExtraProps
>;

export type InitializationEchoIntent = Intent<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput,
  InitializationEchoIntentExtraProps
>;
