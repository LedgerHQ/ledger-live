import { TimerDemoIntentComponent } from "./component";
import { timerDemoIntentDefinition } from "./intentDefinition";
import { type TimerDemoIntentPlatformDefinition } from "./types";

export const timerDemoIntentPlatformDefinition: TimerDemoIntentPlatformDefinition = {
  ...timerDemoIntentDefinition,
  component: TimerDemoIntentComponent,
};
