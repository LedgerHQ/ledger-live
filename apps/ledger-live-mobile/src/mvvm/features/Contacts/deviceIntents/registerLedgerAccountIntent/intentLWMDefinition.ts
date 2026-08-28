import {
  registerLedgerAccountIntentDefinition,
  type RegisterLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterLedgerAccountComponentLWM } from "./componentLWM";

export const registerLedgerAccountIntentLWMDefinition: RegisterLedgerAccountIntentPlatformDefinition =
  {
    ...registerLedgerAccountIntentDefinition,
    component: RegisterLedgerAccountComponentLWM,
  };
