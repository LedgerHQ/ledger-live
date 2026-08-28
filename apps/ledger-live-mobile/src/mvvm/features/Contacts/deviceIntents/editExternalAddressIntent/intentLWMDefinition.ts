import {
  editExternalAddressIntentDefinition,
  type EditExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { EditExternalAddressComponentLWM } from "./componentLWM";

export const editExternalAddressIntentLWMDefinition: EditExternalAddressIntentPlatformDefinition = {
  ...editExternalAddressIntentDefinition,
  component: EditExternalAddressComponentLWM,
};
