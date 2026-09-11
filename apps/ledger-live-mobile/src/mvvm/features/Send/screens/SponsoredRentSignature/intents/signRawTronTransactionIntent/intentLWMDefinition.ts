import { SignTransactionIntentComponentLWM } from "../../../Signature/intents/signTransactionIntent/componentLWM";
import { signRawTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import type { SignRawTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";

/**
 * LWM platform definition for signing a raw TRON transaction (Tronify rent payment TX-A).
 * Reuses signTransactionIntent's component — the device-side signing events are identical,
 * and the UI (confirm on device, loader, cancelled/retry) is the same regardless of whether
 * the transaction was crafted by the bridge or passed in as a raw hex.
 */
export const signRawTronTransactionIntentLWMDefinition: SignRawTransactionIntentPlatformDefinition =
  {
    ...signRawTransactionIntentDefinition,
    component: SignTransactionIntentComponentLWM,
  };
