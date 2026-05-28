/**
 * Cross-platform device intents used by the wallet-side `custom.swap` flow.
 *
 * Each intent has a `Job` that runs against a connected device (or the
 * network, in the broadcast case) and emits typed `JobState` values. The
 * platform-specific React components live alongside their callers (LWM
 * under `apps/ledger-live-mobile`, LWD under `apps/ledger-live-desktop`).
 */
export {
  signApprovalEvmIntentDefinition,
  signApprovalEvmJob,
} from "./signApprovalEvm";
export type {
  SignApprovalEvmIntentDefinition,
  SignApprovalEvmIntentInput,
  SignApprovalEvmJobState,
} from "./signApprovalEvm";

export { signSwapEvmIntentDefinition, signSwapEvmJob } from "./signSwapEvm";
export type {
  SignSwapEvmIntentDefinition,
  SignSwapEvmIntentInput,
  SignSwapEvmJobState,
} from "./signSwapEvm";

export { broadcastEvmIntentDefinition, broadcastEvmJob } from "./broadcastEvm";
export type {
  BroadcastEvmIntentDefinition,
  BroadcastEvmIntentInput,
  BroadcastEvmJobState,
} from "./broadcastEvm";

export {
  signPermit2EvmIntentDefinition,
  signPermit2EvmJob,
  toEIP712Message,
} from "./signPermit2Evm";
export type {
  SignPermit2EvmIntentDefinition,
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
} from "./signPermit2Evm";

export {
  signRfqOrderEvmIntentDefinition,
  signRfqOrderEvmJob,
  toRfqEIP712Message,
} from "./signRfqOrderEvm";
export type {
  RfqProvider,
  SignRfqOrderEvmIntentDefinition,
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmJobState,
} from "./signRfqOrderEvm";

export {
  submitRfqOrderEvmIntentDefinition,
  submitRfqOrderEvmJob,
} from "./submitRfqOrderEvm";
export type {
  SubmitRfqOrderEvmIntentDefinition,
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmJobState,
  SubmitRfqOrderTerminalStatus,
} from "./submitRfqOrderEvm";
