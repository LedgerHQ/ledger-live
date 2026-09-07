import {
  registerLedgerAccountIntentDefinition,
  type RegisterLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterLedgerAccountComponentLWD } from "./componentLWD";

export const registerLedgerAccountIntentLWDDefinition: RegisterLedgerAccountIntentPlatformDefinition =
  {
    ...registerLedgerAccountIntentDefinition,
    component: RegisterLedgerAccountComponentLWD,
  };
