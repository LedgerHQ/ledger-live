import { SignApprovalEvmIntentComponentLWM } from "./componentLWM";
import { signApprovalEvmIntentDefinition } from "./intentDefinition";
import type { SignApprovalEvmIntentPlatformDefinition } from "./types";

export const signApprovalEvmIntentLWMDefinition: SignApprovalEvmIntentPlatformDefinition = {
  ...signApprovalEvmIntentDefinition,
  component: SignApprovalEvmIntentComponentLWM,
};
