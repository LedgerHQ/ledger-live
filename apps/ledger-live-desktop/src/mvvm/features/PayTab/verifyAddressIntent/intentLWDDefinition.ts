import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-intent-verify-address";
import { VerifyAddressIntentComponentLWD } from "./componentLWD";

export const verifyAddressIntentLWDDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressIntentComponentLWD,
};
