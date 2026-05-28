import { broadcastEvmIntentLWMDefinition } from "./broadcastEvmIntent/intentLWMDefinition";
import { signApprovalEvmIntentLWMDefinition } from "./signApprovalEvmIntent/intentLWMDefinition";
import { signPermit2EvmIntentLWMDefinition } from "./signPermit2EvmIntent/intentLWMDefinition";
import { signRfqOrderEvmIntentLWMDefinition } from "./signRfqOrderEvmIntent/intentLWMDefinition";
import { signSwapEvmIntentLWMDefinition } from "./signSwapEvmIntent/intentLWMDefinition";
import { submitRfqOrderEvmIntentLWMDefinition } from "./submitRfqOrderEvmIntent/intentLWMDefinition";

/**
 * LWM platform definitions injected into {@link useSwapDeviceIntentPocOrchestration}.
 *
 * Splitting them out keeps the orchestrator decoupled from any specific
 * production intent, which makes the hook trivially unit-testable with
 * mock intents (per the recommended layout in the device-intent README).
 */
export const SWAP_POC_INTENT_DEFS = {
  signApproval: signApprovalEvmIntentLWMDefinition,
  signSwap: signSwapEvmIntentLWMDefinition,
  signPermit2: signPermit2EvmIntentLWMDefinition,
  signRfqOrder: signRfqOrderEvmIntentLWMDefinition,
  submitRfqOrder: submitRfqOrderEvmIntentLWMDefinition,
  broadcast: broadcastEvmIntentLWMDefinition,
} as const;

export type SwapPocIntentDefinitions = typeof SWAP_POC_INTENT_DEFS;
