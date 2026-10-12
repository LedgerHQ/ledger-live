import {
  registerLedgerAccountIntentDefinition,
  type RegisterLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterLedgerAccountComponent } from "./component";

export const registerLedgerAccountIntentPlatformDefinition: RegisterLedgerAccountIntentPlatformDefinition =
  {
    ...registerLedgerAccountIntentDefinition,
    component: RegisterLedgerAccountComponent,
  };
