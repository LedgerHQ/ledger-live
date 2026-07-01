import { submitRfqOrderEvmJob } from "./job";
import type { SubmitRfqOrderEvmIntentDefinition } from "./types";

/**
 * Cross-platform definition for the RFQ order submit-and-poll intent.
 *
 * The job does not talk to the device (it only hits the swap-api), so
 * `requiresConnectedDevice` is `false`. The executor stays mounted
 * (the device stays connected from the previous signing intent) so the
 * UI can render a "submitting / waiting" loader while the partner fills
 * the order.
 */
export const submitRfqOrderEvmIntentDefinition: SubmitRfqOrderEvmIntentDefinition =
  {
    label: "Submit RFQ order to partner",
    requiresConnectedDevice: false,
    delegateDeviceLockStateHandlingToExecutor: false,
    job: submitRfqOrderEvmJob,
  };
