import {
  predictionsBindingIntentDefinition,
  type PredictionsBindingIntentPlatformDefinition,
} from "@features/platform-predictions";
import { PredictionsBindingIntentComponentLWD } from "./componentLWD";

export const predictionsBindingIntentLWDDefinition: PredictionsBindingIntentPlatformDefinition = {
  ...predictionsBindingIntentDefinition,
  component: PredictionsBindingIntentComponentLWD,
};
