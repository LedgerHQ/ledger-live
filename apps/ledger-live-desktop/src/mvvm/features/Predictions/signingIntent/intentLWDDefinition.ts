import {
  predictionsSigningIntentDefinition,
  type PredictionsSigningIntentPlatformDefinition,
} from "@features/platform-predictions";
import { PredictionsSigningIntentComponentLWD } from "./componentLWD";

export const predictionsSigningIntentLWDDefinition: PredictionsSigningIntentPlatformDefinition = {
  ...predictionsSigningIntentDefinition,
  component: PredictionsSigningIntentComponentLWD,
};
