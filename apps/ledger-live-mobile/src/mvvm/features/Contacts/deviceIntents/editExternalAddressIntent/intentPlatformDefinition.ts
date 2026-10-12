import {
  editExternalAddressIntentDefinition,
  type EditExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { EditExternalAddressComponent } from "./component";

export const editExternalAddressIntentPlatformDefinition: EditExternalAddressIntentPlatformDefinition =
  {
    ...editExternalAddressIntentDefinition,
    component: EditExternalAddressComponent,
  };
