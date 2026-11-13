import { openMyLedgerIntentDefinition } from "@ledgerhq/live-common/intents/openMyLedgerIntent";
import type { OpenMyLedgerIntentPlatformDefinition } from "@ledgerhq/live-common/intents/openMyLedgerIntent";
import { OpenMyLedgerIntentComponent } from "./component";

export const openMyLedgerIntentPlatformDefinition: OpenMyLedgerIntentPlatformDefinition = {
  ...openMyLedgerIntentDefinition,
  component: OpenMyLedgerIntentComponent,
};
