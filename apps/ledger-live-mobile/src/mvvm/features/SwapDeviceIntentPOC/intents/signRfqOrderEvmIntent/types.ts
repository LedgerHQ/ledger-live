import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  SignRfqOrderEvmIntentDefinition,
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/signRfqOrderEvm/index";

export type {
  SignRfqOrderEvmIntentDefinition,
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmJobState,
};

export type SignRfqOrderEvmIntentExtraProps = Record<string, never>;

export type SignRfqOrderEvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignRfqOrderEvmJobState,
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmIntentExtraProps
>;

export type SignRfqOrderEvmIntent = Intent<
  SignRfqOrderEvmJobState,
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmIntentExtraProps
>;
