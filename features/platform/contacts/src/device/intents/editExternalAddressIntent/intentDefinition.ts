import { editExternalAddressIntentJob } from "./job";
import type { EditExternalAddressIntentDefinition } from "./types";

export const editExternalAddressIntentDefinition: EditExternalAddressIntentDefinition = {
  label: "Edit external address",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: editExternalAddressIntentJob,
};
