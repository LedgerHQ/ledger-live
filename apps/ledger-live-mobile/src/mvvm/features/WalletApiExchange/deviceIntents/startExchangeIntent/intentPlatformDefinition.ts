import {
  startExchangeIntentDefinition,
  type StartExchangeIntentPlatformDefinition,
} from "@ledgerhq/live-common/exchange/intents/index";
import { StartExchangeIntentComponent } from "./component";

export const startExchangeIntentPlatformDefinition: StartExchangeIntentPlatformDefinition = {
  ...startExchangeIntentDefinition,
  component: StartExchangeIntentComponent,
};
