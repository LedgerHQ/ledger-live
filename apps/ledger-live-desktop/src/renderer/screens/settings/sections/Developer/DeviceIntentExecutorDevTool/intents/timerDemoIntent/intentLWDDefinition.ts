import { TimerDemoIntentComponentLWD } from "./componentLWD";
import { timerDemoIntentDefinition } from "./intentDefinition";
import { type TimerDemoIntentPlatformDefinition } from "./types";

export const timerDemoIntentLWDDefinition: TimerDemoIntentPlatformDefinition = {
  ...timerDemoIntentDefinition,
  component: TimerDemoIntentComponentLWD,
};
