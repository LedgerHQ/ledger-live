import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-verify-address-intent";
import { VerifyAddressIntentComponentLWD } from "./componentLWD";

export const verifyAddressIntentLWDDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressIntentComponentLWD,
};
