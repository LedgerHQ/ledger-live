import type { Job } from "@features/platform-device-intent";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import type { EditExternalAddressIdentifierInput as EditExternalAddressKitInput } from "@ledgerhq/device-contacts-kit";
import type {
  EditExternalAddressIdentifierDAOutput,
  EditExternalAddressIdentifierDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/EditExternalAddressIdentifierDeviceActionTypes.js";
import {
  catchError,
  defer,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeWhile,
  tap,
} from "rxjs";
import {
  mapDeviceActionErrorToFailureJobState,
  mapDmkErrorToError,
} from "../../contactsDeviceActionFailure";
import {
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
  mapBytesToProof,
} from "../../contactsKitMappers";
import { ContactDeviceIntentScopeEditUnsupportedError } from "../../errors";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "./types";

function mapDeviceActionOutputToResult(
  input: EditExternalAddressIntentInput,
  output: EditExternalAddressIdentifierDAOutput,
): EditExternalAddressResult {
  return {
    // Echo the caller's own representations, not the kit's, so the persisted
    // record stays in Ledger Wallet's own conventions (family taxonomy,
    // chainId representation) rather than the kit's wire-level ones.
    contactName: input.contactName,
    scope: input.newScope,
    address: input.newAddress,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    // An identifier edit rotates only the address-level proof; the group-level
    // name proof passes through untouched.
    hmacProof: input.hmacProof,
    hmacRest: mapBytesToProof(output.hmacRest),
  };
}

type Outcome = Readonly<{
  jobState: EditExternalAddressJobState;
  /** Terminal outcomes complete the job.*/
  terminal: boolean;
  /** Settles the port promise. Absent while the job is still running. */
  report?: ContactIntentResult<EditExternalAddressResult>;
}>;

/**
 * Builds the mapper for one job run. Everything that varies — the caller's
 * input, the connected device, the replay handle — is captured once here, so
 * every branch of the device action lands in one place and the pipeline below
 * stays free of conditionals.
 */
function createOutcomeMapper(
  params: Readonly<{
    input: EditExternalAddressIntentInput;
    awaitingConfirmation: EditExternalAddressJobState;
    retry: () => void;
  }>,
): (state: EditExternalAddressIdentifierDAState) => Outcome {
  return state => {
    switch (state.status) {
      case DeviceActionStatus.NotStarted:
        return { jobState: { type: "pending" }, terminal: false };

      case DeviceActionStatus.Pending:
        return {
          jobState:
            state.intermediateValue.requiredUserInteraction ===
            UserInteractionRequired.RegisterWallet
              ? params.awaitingConfirmation
              : { type: "pending" },
          terminal: false,
        };

      case DeviceActionStatus.Completed: {
        const result = mapDeviceActionOutputToResult(params.input, state.output);
        return {
          jobState: { type: "completed" },
          terminal: true,
          report: { type: "success", result },
        };
      }

      case DeviceActionStatus.Stopped: {
        const error = new Error("Edit external address identifier was stopped");
        return {
          jobState: { type: "failed", error },
          terminal: true,
          report: { type: "failure", error },
        };
      }

      case DeviceActionStatus.Error: {
        const jobState = mapDeviceActionErrorToFailureJobState(state.error);

        // A rejection is the one failure the user can undo, so it stays open and
        // carries the replay handle instead of settling the port promise.
        return jobState.type === "device-rejected"
          ? { jobState: { ...jobState, retry: params.retry }, terminal: false }
          : { jobState, terminal: true, report: { type: "failure", error: jobState.error } };
      }
    }
  };
}

/**
 * Edit an external address on the device via the Contacts kit's
 * `ContactsManager.editExternalAddressIdentifier()`.
 *
 * The port models this as one "edit" covering both the entry's identifier and
 * its scope, but the device serves them as two separate commands and the kit
 * only ships the identifier one so far (DSDK-1380 owns EDIT SCOPE). Until it
 * lands, an edit that touches the scope is refused up front rather than
 * half-applied: the scope is bound into the address-level `hmacRest`, so
 * changing the identifier and leaving the scope behind would desync the stored
 * proof from the device.
 */
export const editExternalAddressIntentJob: Job<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ContactIntentResult<EditExternalAddressResult>
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const retries = new Subject<void>();
  const retry = () => retries.next();

  const awaitingConfirmation: EditExternalAddressJobState = {
    type: "awaiting-device-confirmation",
    step: "identifier",
    deviceModelId: deviceConnectionResult.connectedDevice.modelId,
    deviceName: deviceConnectionResult.compatDeviceName,
  };

  const toOutcome = createOutcomeMapper({ input, awaitingConfirmation, retry });

  return defer(() => {
    if (input.newScope !== input.previousScope) {
      const error = new ContactDeviceIntentScopeEditUnsupportedError();
      reporter.report({ type: "failure", error });
      return of<EditExternalAddressJobState>({ type: "scope-edit-unsupported", error });
    }

    let deviceActionInput: EditExternalAddressKitInput;
    try {
      deviceActionInput = {
        contactName: input.contactName,
        scope: input.newScope,
        previousIdentifier: mapIdentifierToBytes(input.previousAddress),
        newIdentifier: mapIdentifierToBytes(input.newAddress),
        // The kit's family table is keyed by the lowercased coin-app name
        // (e.g. "ethereum"), distinct from Ledger Wallet's own family
        // grouping (e.g. "evm") carried in `input.blockchainFamily`.
        blockchainFamily: deviceExtractedContext.currentAppName.toLowerCase(),
        chainId: mapChainIdToBigInt(input.chainId),
        groupHandle: mapGroupHandleToBytes(input.groupHandle),
        hmacProof: mapProofToBytes(input.hmacProof),
        hmacRest: mapProofToBytes(input.hmacRest),
        skipOpenApp: true,
      };
    } catch (error) {
      const failure = { type: "invalid-input", error: mapDmkErrorToError(error) } as const;
      reporter.report({ type: "failure", error: failure.error });
      return of<EditExternalAddressJobState>(failure);
    }

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      appName: deviceExtractedContext.currentAppName,
    }).build();

    /** Pairs the kit's `cancel` with unsubscription, so teardown is one concern. */
    const deviceAction = new Observable<EditExternalAddressIdentifierDAState>(subscriber => {
      const { observable, cancel } =
        contactsManager.editExternalAddressIdentifier(deviceActionInput);
      const subscription = observable.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        cancel();
      };
    });

    return retries.pipe(
      startWith(undefined),
      // switchMap tears down the superseded attempt before starting the next,
      // so replaying on retry needs no run bookkeeping of its own.
      switchMap(() => deviceAction),
      map(toOutcome),
      tap(outcome => outcome.report && reporter.report(outcome.report)),
      takeWhile(outcome => !outcome.terminal, true),
      map(({ jobState }) => jobState),
      // A transport-level failure errors the kit's observable directly (no
      // DeviceActionStatus.Error to map), so this is the only place that can
      // catch it. Per the Device Intent Executor contract, jobs report their
      // own failures as a terminal JobState instead of erroring the job
      // observable, which would push the executor into its generic fallback
      // state instead of this intent's own InfoState.
      catchError((error: unknown) => {
        const mapped = mapDmkErrorToError(error);
        reporter.report({ type: "failure", error: mapped });
        return of<EditExternalAddressJobState>({ type: "failed", error: mapped });
      }),
    );
  }).pipe(reporter.cancelOnUnsubscribe());
};
