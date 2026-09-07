import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-verify-address-intent";
import { VerifyAddressIntentComponentLWM } from "./componentLWM";

export const verifyAddressIntentLWMDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressIntentComponentLWM,
};
