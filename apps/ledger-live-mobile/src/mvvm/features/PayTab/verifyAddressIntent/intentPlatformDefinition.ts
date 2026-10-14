import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-verify-address-intent";
import { VerifyAddressIntentComponent } from "./component";

export const verifyAddressIntentPlatformDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyAddressIntentComponent,
};
