import { signApprovalEvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/signApprovalEvm/index";
import { SignApprovalEvmIntentComponentLWM } from "./componentLWM";
import type { SignApprovalEvmIntentPlatformDefinition } from "./types";

export const signApprovalEvmIntentLWMDefinition: SignApprovalEvmIntentPlatformDefinition = {
  ...signApprovalEvmIntentDefinition,
  component: SignApprovalEvmIntentComponentLWM,
};
