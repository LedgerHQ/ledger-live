import {
  registerExternalAddressIntentDefinition,
  type RegisterExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RegisterExternalAddressComponentLWM } from "./componentLWM";

export const registerExternalAddressIntentLWMDefinition: RegisterExternalAddressIntentPlatformDefinition =
  {
    ...registerExternalAddressIntentDefinition,
    component: RegisterExternalAddressComponentLWM,
  };
