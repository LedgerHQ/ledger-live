import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  SignPermit2EvmIntentDefinition,
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/signPermit2Evm/index";

export type {
  SignPermit2EvmIntentDefinition,
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
};

export type SignPermit2EvmIntentExtraProps = Record<string, never>;

export type SignPermit2EvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignPermit2EvmJobState,
  SignPermit2EvmIntentInput,
  SignPermit2EvmIntentExtraProps
>;

export type SignPermit2EvmIntent = Intent<
  SignPermit2EvmJobState,
  SignPermit2EvmIntentInput,
  SignPermit2EvmIntentExtraProps
>;
