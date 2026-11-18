import {
  predictionsSigningIntentDefinition,
  type PredictionsSigningIntentPlatformDefinition,
} from "@features/platform-predictions";
import { PredictionsSigningIntentComponentLWM } from "./componentLWM";

export const predictionsSigningIntentLWMDefinition: PredictionsSigningIntentPlatformDefinition = {
  ...predictionsSigningIntentDefinition,
  component: PredictionsSigningIntentComponentLWM,
};
