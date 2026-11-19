import {
  signTransactionIntentWithResultDefinition,
  type SignTransactionIntentWithResultPlatformDefinition,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import { StakePositionSignatureComponentLWD } from "./componentLWD";
import type { StakePositionSignatureExtraProps } from "./types";

export const stakePositionSignatureIntentLWDDefinition: SignTransactionIntentWithResultPlatformDefinition<StakePositionSignatureExtraProps> =
  {
    ...signTransactionIntentWithResultDefinition,
    component: StakePositionSignatureComponentLWD,
  };
