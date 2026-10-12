import { InitializationEchoIntentComponent } from "./component";
import { initializationEchoIntentDefinition } from "./intentDefinition";
import { type InitializationEchoIntentPlatformDefinition } from "./types";

export const initializationEchoIntentPlatformDefinition: InitializationEchoIntentPlatformDefinition =
  {
    ...initializationEchoIntentDefinition,
    component: InitializationEchoIntentComponent,
  };
