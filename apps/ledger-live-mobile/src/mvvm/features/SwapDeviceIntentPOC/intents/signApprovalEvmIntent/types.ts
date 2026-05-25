import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  SignApprovalEvmIntentDefinition,
  SignApprovalEvmIntentInput,
  SignApprovalEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/signApprovalEvm/index";

export type {
  SignApprovalEvmIntentDefinition,
  SignApprovalEvmIntentInput,
  SignApprovalEvmJobState,
};

export type SignApprovalEvmIntentExtraProps = Record<string, never>;

export type SignApprovalEvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput,
  SignApprovalEvmIntentExtraProps
>;

export type SignApprovalEvmIntent = Intent<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput,
  SignApprovalEvmIntentExtraProps
>;
