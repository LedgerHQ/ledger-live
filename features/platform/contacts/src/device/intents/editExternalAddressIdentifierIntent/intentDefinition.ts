import { EditExternalAddressIdentifierComponent } from "./component";
import { editExternalAddressIdentifierIntentJob } from "./job";
import type { EditExternalAddressIdentifierIntentPlatformDefinition } from "./types";

export const editExternalAddressIdentifierIntentPlatformDefinition: EditExternalAddressIdentifierIntentPlatformDefinition =
  {
    label: "Edit external address identifier",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editExternalAddressIdentifierIntentJob,
    component: EditExternalAddressIdentifierComponent,
  };
