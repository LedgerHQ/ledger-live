import {
  showExchangeErrorIntentDefinition,
  type ShowExchangeErrorIntentPlatformDefinition,
} from "@ledgerhq/live-common/exchange/intents/index";
import { ShowExchangeErrorIntentComponent } from "./component";

export const showExchangeErrorIntentPlatformDefinition: ShowExchangeErrorIntentPlatformDefinition =
  {
    ...showExchangeErrorIntentDefinition,
    component: ShowExchangeErrorIntentComponent,
  };
