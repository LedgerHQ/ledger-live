import { RegisterExternalAddressComponent } from "./component";
import { registerExternalAddressIntentJob } from "./job";
import type { RegisterExternalAddressIntentPlatformDefinition } from "./types";

export const registerExternalAddressIntentPlatformDefinition: RegisterExternalAddressIntentPlatformDefinition =
  {
    label: "Register external address",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: registerExternalAddressIntentJob,
    component: RegisterExternalAddressComponent,
  };
