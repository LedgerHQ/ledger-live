import {
  registerExternalAddressIntentDefinition,
  type RegisterExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterExternalAddressComponentLWD } from "./componentLWD";

export const registerExternalAddressIntentLWDDefinition: RegisterExternalAddressIntentPlatformDefinition =
  {
    ...registerExternalAddressIntentDefinition,
    component: RegisterExternalAddressComponentLWD,
  };
