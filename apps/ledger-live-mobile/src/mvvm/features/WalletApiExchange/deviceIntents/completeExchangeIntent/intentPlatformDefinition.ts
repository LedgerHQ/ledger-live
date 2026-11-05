import {
  completeExchangeIntentDefinition,
  type CompleteExchangeIntentPlatformDefinition,
} from "@ledgerhq/live-common/exchange/intents/index";
import { CompleteExchangeIntentComponent } from "./component";

export const completeExchangeIntentPlatformDefinition: CompleteExchangeIntentPlatformDefinition = {
  ...completeExchangeIntentDefinition,
  component: CompleteExchangeIntentComponent,
};
