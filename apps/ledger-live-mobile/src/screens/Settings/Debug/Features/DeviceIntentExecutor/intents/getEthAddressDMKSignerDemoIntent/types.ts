import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type GetEthAddressDMKSignerDemoIntentJobState =
  | { type: "deriving"; daStatus: string; userInteraction?: string }
  | { type: "derived"; address: string }
  | { type: "failed"; error: unknown };

export type GetEthAddressDMKSignerDemoIntentInput = { derivationPath: string };

export type GetEthAddressDMKSignerDemoIntentExtraProps = Record<string, never>;

export type GetEthAddressDMKSignerDemoIntentDefinition = IntentDefinition<
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentInput
>;

export type GetEthAddressDMKSignerDemoIntentPlatformDefinition = IntentPlatformDefinition<
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentInput,
  GetEthAddressDMKSignerDemoIntentExtraProps
>;

export type GetEthAddressDMKSignerDemoIntent = Intent<
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentInput,
  GetEthAddressDMKSignerDemoIntentExtraProps
>;
