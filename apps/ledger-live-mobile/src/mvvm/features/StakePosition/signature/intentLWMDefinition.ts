import {
  signTransactionIntentWithResultDefinition,
  type SignTransactionIntentWithResultPlatformDefinition,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import { StakePositionSignatureComponentLWM } from "./componentLWM";
import type { StakePositionSignatureExtraProps } from "./types";

export const stakePositionSignatureIntentLWMDefinition: SignTransactionIntentWithResultPlatformDefinition<StakePositionSignatureExtraProps> =
  {
    ...signTransactionIntentWithResultDefinition,
    component: StakePositionSignatureComponentLWM,
  };
