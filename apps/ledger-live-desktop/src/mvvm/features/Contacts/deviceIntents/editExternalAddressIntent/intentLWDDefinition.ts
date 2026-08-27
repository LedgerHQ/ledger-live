import {
  editExternalAddressIntentDefinition,
  type EditExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { EditExternalAddressComponentLWD } from "./componentLWD";

export const editExternalAddressIntentLWDDefinition: EditExternalAddressIntentPlatformDefinition = {
  ...editExternalAddressIntentDefinition,
  component: EditExternalAddressComponentLWD,
};
