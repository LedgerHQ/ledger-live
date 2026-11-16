import {
  predictionsBindingIntentDefinition,
  type PredictionsBindingIntentPlatformDefinition,
} from "@features/platform-predictions";
import { PredictionsBindingIntentComponentLWM } from "./componentLWM";

export const predictionsBindingIntentLWMDefinition: PredictionsBindingIntentPlatformDefinition = {
  ...predictionsBindingIntentDefinition,
  component: PredictionsBindingIntentComponentLWM,
};
