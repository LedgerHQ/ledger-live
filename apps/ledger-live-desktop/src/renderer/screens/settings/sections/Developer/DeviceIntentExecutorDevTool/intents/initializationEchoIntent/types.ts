import type {
  DeviceExtractedContext,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@ledgerhq/device-intent";

export type InitializationEchoIntentJobState = {
  type: "contextReceived";
  deviceExtractedContext: DeviceExtractedContext;
};

export type InitializationEchoIntentInput = undefined;

type InitializationEchoIntentExtraProps = Record<string, never>;

export type InitializationEchoIntentDefinition = IntentDefinition<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput
>;

export type InitializationEchoIntentPlatformDefinition = IntentPlatformDefinition<
  InitializationEchoIntentJobState,
  InitializationEchoIntentInput,
  InitializationEchoIntentExtraProps
>;
