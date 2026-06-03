import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  SubmitRfqOrderEvmIntentDefinition,
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/submitRfqOrderEvm/index";

export type {
  SubmitRfqOrderEvmIntentDefinition,
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmJobState,
};

export type SubmitRfqOrderEvmIntentExtraProps = Record<string, never>;

export type SubmitRfqOrderEvmIntentPlatformDefinition =
  IntentPlatformDefinition<
    SubmitRfqOrderEvmJobState,
    SubmitRfqOrderEvmIntentInput,
    SubmitRfqOrderEvmIntentExtraProps
  >;

export type SubmitRfqOrderEvmIntent = Intent<
  SubmitRfqOrderEvmJobState,
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmIntentExtraProps
>;
