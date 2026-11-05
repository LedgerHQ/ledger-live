import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-intent-verify-address";
import { ReceiveVerifyIntentComponent } from "./component";

export const receiveVerifyIntentDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: ReceiveVerifyIntentComponent,
};
