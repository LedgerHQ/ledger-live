import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-intent-verify-address";
import { VerifyAddressIntentComponentLWM } from "./componentLWM";

export const verifyAddressIntentLWMDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressIntentComponentLWM,
};
