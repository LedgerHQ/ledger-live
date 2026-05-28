import { concat, of } from "rxjs";
import type { Job } from "@ledgerhq/device-intent";
import { runSignTypedDataEvm } from "../shared/signTypedDataEvm";
import type {
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
} from "./types";

/**
 * Job for the Permit2 EIP-712 signing intent.
 *
 * Mirrors {@link signApprovalEvmJob} so the orchestration can reuse the
 * same sign-result state machine: emits an initial `preparing` value
 * synchronously, surfaces device-driven progress as the DMK signer does,
 * and converts errors into a terminal `failed` state instead of an
 * observable error.
 *
 * The DMK plumbing is shared with the RFQ signing intent through
 * {@link runSignTypedDataEvm}; this job just adapts the shared run
 * states into `SignPermit2EvmJobState` and prepends the synchronous
 * `preparing` value the executor expects.
 */
export const signPermit2EvmJob: Job<
  SignPermit2EvmJobState,
  SignPermit2EvmIntentInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    of<SignPermit2EvmJobState>({ type: "preparing" }),
    runSignTypedDataEvm(
      deviceConnectionResult,
      input.typedData,
      input.derivationPath,
      "Sign permit failed",
    ),
  );
