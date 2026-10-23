import type { Job } from "@features/platform-device-intent";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import type { RenameContactInput as RenameContactKitInput } from "@ledgerhq/device-contacts-kit";
import type {
  RenameContactDAOutput,
  RenameContactDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/RenameContactDeviceActionTypes.js";
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
  handleContactDeviceActionTransportError,
  mapDeviceActionErrorToFailureJobState,
  mapDmkErrorToError,
  throwIfDeviceDisconnected,
} from "../../contactsDeviceActionFailure";
import {
  mapBytesToGroupHandle,
  mapBytesToProof,
  mapGroupHandleToBytes,
  mapProofToBytes,
} from "../../contactsKitMappers";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type { RenameContactIntentInput, RenameContactJobState, RenameContactResult } from "./types";

function mapDeviceActionOutputToResult(output: RenameContactDAOutput): RenameContactResult {
  // Unlike register, nothing here needs echoing back from the caller's input:
  // rename carries no family/chainId taxonomy, and the names are plain strings
  // the device hands back verbatim.
  return {
    previousContactName: output.previousContactName,
    contactName: output.contactName,
    groupHandle: mapBytesToGroupHandle(output.groupHandle),
    hmacProof: mapBytesToProof(output.hmacProof),
  };
}

type Outcome = Readonly<{
  jobState: RenameContactJobState;
  /** Terminal outcomes complete the job.*/
  terminal: boolean;
  /** Settles the port promise. Absent while the job is still running. */
  report?: ContactIntentResult<RenameContactResult>;
}>;

/**
 * Builds the mapper for one job run. Everything that varies — the connected
 * device and the replay handle — is captured once here, so every branch of the
 * device action lands in one place and the pipeline below stays free of
 * conditionals.
 */
function createOutcomeMapper(
  params: Readonly<{
    awaitingConfirmation: RenameContactJobState;
    retry: () => void;
  }>,
): (state: RenameContactDAState) => Outcome {
  return state => {
    switch (state.status) {
      case DeviceActionStatus.NotStarted:
        return { jobState: { type: "pending" }, terminal: false };

      case DeviceActionStatus.Pending:
        // The device action walks to the dashboard before asking for approval,
        // so every interaction other than the approval prompt (unlocking,
        // allowing the secure connection, closing the running app) stays on the
        // spinner — the executor owns those screens.
        return {
          jobState:
            state.intermediateValue.requiredUserInteraction ===
            UserInteractionRequired.RegisterWallet
              ? params.awaitingConfirmation
              : { type: "pending" },
          terminal: false,
        };

      case DeviceActionStatus.Completed: {
        const result = mapDeviceActionOutputToResult(state.output);
        return {
          jobState: { type: "completed" },
          terminal: true,
          report: { type: "success", result },
        };
      }

      case DeviceActionStatus.Stopped: {
        const error = new Error("Rename contact was stopped");
        return {
          jobState: { type: "failed", error },
          terminal: true,
          report: { type: "failure", error },
        };
      }

      case DeviceActionStatus.Error: {
        throwIfDeviceDisconnected(state.error);
        const jobState = mapDeviceActionErrorToFailureJobState(state.error);

        // These two stay open instead of settling the port promise. A rejection
        // can be retried on this device. A foreign proof (0x6982) is checked
        // before the device shows a confirmation, so this screen is the only
        // message the user gets — settling would tear the executor down first.
        if (jobState.type === "device-rejected") {
          return { jobState: { ...jobState, retry: params.retry }, terminal: false };
        }
        if (jobState.type === "existing-group-verification-failed") {
          return { jobState, terminal: false };
        }
        return { jobState, terminal: true, report: { type: "failure", error: jobState.error } };
      }
    }
  };
}

/**
 * Rename a contact group on the device via the Contacts kit's
 * `ContactsManager.renameContact()`.
 *
 * Rename is a blockchain-agnostic dashboard operation: the device action walks
 * to the dashboard itself and gates on the Contacts minimum OS version, so this
 * job never opens a coin app and never applies an app-version floor of its own.
 */
export const renameContactIntentJob: Job<
  RenameContactJobState,
  RenameContactIntentInput,
  ContactIntentResult<RenameContactResult>
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const retries = new Subject<void>();
  const retry = () => retries.next();

  const awaitingConfirmation: RenameContactJobState = {
    type: "awaiting-device-confirmation",
    deviceModelId: deviceConnectionResult.connectedDevice.modelId,
    deviceName: deviceConnectionResult.compatDeviceName,
  };

  const toOutcome = createOutcomeMapper({ awaitingConfirmation, retry });

  return defer(() => {
    let deviceActionInput: RenameContactKitInput;
    try {
      deviceActionInput = {
        previousContactName: input.previousContactName,
        newContactName: input.newContactName,
        groupHandle: mapGroupHandleToBytes(input.groupHandle),
        hmacProof: mapProofToBytes(input.hmacProof),
      };
    } catch (error) {
      const failure = { type: "invalid-input", error: mapDmkErrorToError(error) } as const;
      reporter.report({ type: "failure", error: failure.error });
      return of<RenameContactJobState>(failure);
    }

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      // The manager needs an app name to build, but rename is served by the OS:
      // the device action ignores it and goes to the dashboard instead.
      appName: deviceExtractedContext.currentAppName,
    }).build();

    /** Pairs the kit's `cancel` with unsubscription, so teardown is one concern. */
    const deviceAction = new Observable<RenameContactDAState>(subscriber => {
      const { observable, cancel } = contactsManager.renameContact(deviceActionInput);
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
      catchError((error: unknown) =>
        handleContactDeviceActionTransportError<RenameContactJobState>(error, mapped =>
          reporter.report({ type: "failure", error: mapped }),
        ),
      ),
    );
  }).pipe(reporter.cancelOnUnsubscribe());
};
