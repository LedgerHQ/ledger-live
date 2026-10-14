import {
  registerExternalAddressIntentDefinition,
  type RegisterExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterExternalAddressComponent } from "./component";

export const registerExternalAddressIntentPlatformDefinition: RegisterExternalAddressIntentPlatformDefinition =
  {
    ...registerExternalAddressIntentDefinition,
    component: RegisterExternalAddressComponent,
  };
