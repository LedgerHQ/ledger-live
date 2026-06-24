import { type GetEthAddressDMKSignerDemoIntentDefinition } from "./types";
import { getEthAddressDMKSignerDemoIntentJob } from "./job";

export const getEthAddressDMKSignerDemoIntentDefinition: GetEthAddressDMKSignerDemoIntentDefinition =
  {
    label: "Get ETH Address (DMK Signer)",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: getEthAddressDMKSignerDemoIntentJob,
  };
