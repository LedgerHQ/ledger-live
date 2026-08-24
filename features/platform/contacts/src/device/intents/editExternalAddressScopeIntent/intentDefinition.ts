import { EditExternalAddressScopeComponent } from "./component";
import { editExternalAddressScopeIntentJob } from "./job";
import type { EditExternalAddressScopeIntentPlatformDefinition } from "./types";

export const editExternalAddressScopeIntentPlatformDefinition: EditExternalAddressScopeIntentPlatformDefinition =
  {
    label: "Edit external address scope",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: editExternalAddressScopeIntentJob,
    component: EditExternalAddressScopeComponent,
  };
