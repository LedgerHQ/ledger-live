import { TimerDemoIntentComponentLWM } from "./componentLWM";
import { timerDemoIntentDefinition } from "./intentDefinition";
import { type TimerDemoIntentPlatformDefinition } from "./types";

export const timerDemoIntentLWMDefinition: TimerDemoIntentPlatformDefinition = {
  ...timerDemoIntentDefinition,
  component: TimerDemoIntentComponentLWM,
};
