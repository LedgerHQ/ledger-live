import type { Job } from "@features/platform-device-intent";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import type { RegisterExternalAddressInput as RegisterExternalAddressKitInput } from "@ledgerhq/device-contacts-kit";
import type {
  RegisterExternalAddressDAOutput,
  RegisterExternalAddressDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/RegisterExternalAddressDeviceActionTypes.js";
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
  mapBytesToGroupHandle,
  mapBytesToProof,
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
} from "../../contactsKitMappers";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type {
  RegisterExternalAddressIntentInput,
  RegisterExternalAddressJobState,
  RegisterExternalAddressResult,
} from "./types";

function mapExistingContactGroupToBytes(
  existingContactGroup: RegisterExternalAddressIntentInput["existingContactGroup"],
): { groupHandle: Uint8Array; hmacProof: Uint8Array } | undefined {
  if (existingContactGroup === undefined) return undefined;

  return {
    groupHandle: mapGroupHandleToBytes(existingContactGroup.groupHandle),
    hmacProof: mapProofToBytes(existingContactGroup.hmacProof),
  };
}

function mapDeviceActionOutputToResult(
  input: RegisterExternalAddressIntentInput,
  output: RegisterExternalAddressDAOutput,
): RegisterExternalAddressResult {
  return {
    mode: output.mode,
    // Echo the caller's own representations, not the kit's, so the persisted
    // record stays in Ledger Wallet's own conventions (family taxonomy,
    // chainId representation) rather than the kit's wire-level ones.
    contactName: input.contactName,
    scope: input.scope,
    address: input.address,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: mapBytesToGroupHandle(output.groupHandle),
    hmacProof: mapBytesToProof(output.hmacProof),
    hmacRest: mapBytesToProof(output.hmacRest),
  };
}

type Outcome = Readonly<{
  jobState: RegisterExternalAddressJobState;
  /** Terminal outcomes complete the job.*/
  terminal: boolean;
  /** Settles the port promise. Absent while the job is still running. */
  report?: ContactIntentResult<RegisterExternalAddressResult>;
}>;

/**
 * Builds the mapper for one job run. Everything that varies — the caller's
 * input, the connected device, the replay handle — is captured once here, so
 * every branch of the device action lands in one place and the pipeline below
 * stays free of conditionals.
 */
function createOutcomeMapper(
  params: Readonly<{
    input: RegisterExternalAddressIntentInput;
    awaitingConfirmation: RegisterExternalAddressJobState;
    retry: () => void;
  }>,
): (state: RegisterExternalAddressDAState) => Outcome {
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
        const error = new Error("Register external address was stopped");
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
 * Register an external address on the device via the Contacts kit's
 * `ContactsManager.registerExternalAddress()`.
 */
export const registerExternalAddressIntentJob: Job<
  RegisterExternalAddressJobState,
  RegisterExternalAddressIntentInput,
  ContactIntentResult<RegisterExternalAddressResult>
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const retries = new Subject<void>();
  const retry = () => retries.next();

  const awaitingConfirmation: RegisterExternalAddressJobState = {
    type: "awaiting-device-confirmation",
    deviceModelId: deviceConnectionResult.connectedDevice.modelId,
    deviceName: deviceConnectionResult.compatDeviceName,
  };

  const toOutcome = createOutcomeMapper({ input, awaitingConfirmation, retry });

  return defer(() => {
    let deviceActionInput: RegisterExternalAddressKitInput;
    try {
      deviceActionInput = {
        contactName: input.contactName,
        scope: input.scope,
        identifier: mapIdentifierToBytes(input.address),
        // The kit's family table is keyed by the lowercased coin-app name
        // (e.g. "ethereum"), distinct from Ledger Wallet's own family
        // grouping (e.g. "evm") carried in `input.blockchainFamily`.
        blockchainFamily: deviceExtractedContext.currentAppName.toLowerCase(),
        chainId: mapChainIdToBigInt(input.chainId),
        existingContactGroup: mapExistingContactGroupToBytes(input.existingContactGroup),
        skipOpenApp: true,
      };
    } catch (error) {
      const failure = { type: "invalid-input", error: mapDmkErrorToError(error) } as const;
      reporter.report({ type: "failure", error: failure.error });
      return of<RegisterExternalAddressJobState>(failure);
    }

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      appName: deviceExtractedContext.currentAppName,
    }).build();

    /** Pairs the kit's `cancel` with unsubscription, so teardown is one concern. */
    const deviceAction = new Observable<RegisterExternalAddressDAState>(subscriber => {
      const { observable, cancel } = contactsManager.registerExternalAddress(deviceActionInput);
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
        return of<RegisterExternalAddressJobState>({ type: "failed", error: mapped });
      }),
    );
  }).pipe(reporter.cancelOnUnsubscribe());
};
