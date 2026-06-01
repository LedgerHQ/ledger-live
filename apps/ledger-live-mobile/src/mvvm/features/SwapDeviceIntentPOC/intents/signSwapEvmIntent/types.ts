import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  SignSwapEvmIntentDefinition,
  SignSwapEvmIntentInput,
  SignSwapEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/signSwapEvm/index";

export type {
  SignSwapEvmIntentDefinition,
  SignSwapEvmIntentInput,
  SignSwapEvmJobState,
};

export type SignSwapEvmIntentExtraProps = Record<string, never>;

export type SignSwapEvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput,
  SignSwapEvmIntentExtraProps
>;

export type SignSwapEvmIntent = Intent<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput,
  SignSwapEvmIntentExtraProps
>;
