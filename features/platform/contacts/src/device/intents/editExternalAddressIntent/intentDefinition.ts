import { EditExternalAddressComponent } from "./component";
import { editExternalAddressIntentJob } from "./job";
import type { EditExternalAddressIntentPlatformDefinition } from "./types";

export const editExternalAddressIntentPlatformDefinition: EditExternalAddressIntentPlatformDefinition =
  {
    label: "Edit external address",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editExternalAddressIntentJob,
    component: EditExternalAddressComponent,
  };
