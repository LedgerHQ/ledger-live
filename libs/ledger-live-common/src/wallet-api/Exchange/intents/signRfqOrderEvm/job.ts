import { concat, of } from "rxjs";
import type { Job } from "@ledgerhq/device-intent";
import { runSignTypedDataEvm } from "../shared/signTypedDataEvm";
import type {
  SignRfqOrderEvmIntentInput,
  SignRfqOrderEvmJobState,
} from "./types";

/**
 * Job for the RFQ order EIP-712 signing intent (UniswapX, 1inch Fusion).
 *
 * Reuses the shared {@link runSignTypedDataEvm} DMK plumbing so RFQ
 * signing surfaces the same intermediate states as Permit2 signing and
 * goes through the CAL-wired SignerEth (typed-data filters load
 * on-device instead of falling back to blind signing).
 *
 * Emits an initial `preparing` value synchronously so the executor never
 * renders the intent component with `jobState: undefined`; converts
 * device errors into a terminal `failed` state instead of an observable
 * error so the orchestrator can react in `onIntentJobComplete`.
 */
export const signRfqOrderEvmJob: Job<
  SignRfqOrderEvmJobState,
  SignRfqOrderEvmIntentInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    of<SignRfqOrderEvmJobState>({ type: "preparing" }),
    runSignTypedDataEvm(
      deviceConnectionResult,
      input.typedData,
      input.derivationPath,
      "Sign RFQ order failed",
    ),
  );
