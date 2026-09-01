import type { Job } from "@features/platform-device-intent";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { ContactsManagerBuilder } from "@ledgerhq/device-contacts-kit";
import type {
  EditExternalAddressIdentifierInput as EditExternalAddressIdentifierKitInput,
  EditExternalAddressScopeInput as EditExternalAddressScopeKitInput,
} from "@ledgerhq/device-contacts-kit";
import type {
  EditExternalAddressIdentifierDAOutput,
  EditExternalAddressIdentifierDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/EditExternalAddressIdentifierDeviceActionTypes.js";
import type {
  EditExternalAddressScopeDAOutput,
  EditExternalAddressScopeDAState,
} from "@ledgerhq/device-contacts-kit/api/app-binder/EditExternalAddressScopeDeviceActionTypes.js";
import {
  catchError,
  concat,
  concatMap,
  defer,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeWhile,
} from "rxjs";
import {
  mapDeviceActionErrorToFailureJobState,
  mapDmkErrorToError,
} from "../../contactsDeviceActionFailure";
import {
  mapBytesToProof,
  mapChainIdToBigInt,
  mapGroupHandleToBytes,
  mapIdentifierToBytes,
  mapProofToBytes,
} from "../../contactsKitMappers";
import { createContactIntentResultReporter, type ContactIntentResult } from "../resultReporter";
import type {
  EditExternalAddressIntentInput,
  EditExternalAddressJobState,
  EditExternalAddressResult,
} from "./types";

type StepOutcome =
  | { readonly kind: "proof"; readonly hmacRest: Uint8Array }
  | {
      readonly kind: "state";
      readonly jobState: EditExternalAddressJobState;
      readonly terminal: boolean;
      readonly report?: ContactIntentResult<EditExternalAddressResult>;
    };

type DeviceActionState = EditExternalAddressIdentifierDAState | EditExternalAddressScopeDAState;

type DeviceActionOutput = EditExternalAddressIdentifierDAOutput | EditExternalAddressScopeDAOutput;

const OPEN_JOB_STATE_TYPES = new Set<EditExternalAddressJobState["type"]>([
  "pending",
  "awaiting-device-confirmation",
  "partial-result",
  "device-rejected",
]);

/** Pairs the kit's `cancel` with unsubscription, so teardown is one concern. */
function createDeviceActionObservable<State>(
  call: () => { observable: Observable<State>; cancel: () => void },
): Observable<State> {
  return new Observable<State>(subscriber => {
    const { observable, cancel } = call();
    const subscription = observable.subscribe(subscriber);

    return () => {
      subscription.unsubscribe();
      cancel();
    };
  });
}

function createStepOutcomeMapper(
  awaitingConfirmation: EditExternalAddressJobState,
): (state: DeviceActionState) => StepOutcome {
  return state => {
    switch (state.status) {
      case DeviceActionStatus.NotStarted:
        return { kind: "state", jobState: { type: "pending" }, terminal: false };

      case DeviceActionStatus.Pending:
        return {
          kind: "state",
          jobState:
            state.intermediateValue.requiredUserInteraction ===
            UserInteractionRequired.RegisterWallet
              ? awaitingConfirmation
              : { type: "pending" },
          terminal: false,
        };

      case DeviceActionStatus.Completed: {
        const output: DeviceActionOutput = state.output;
        return { kind: "proof", hmacRest: output.hmacRest };
      }

      case DeviceActionStatus.Stopped: {
        const error = new Error("Edit external address was stopped");
        return {
          kind: "state",
          jobState: { type: "failed", error },
          terminal: true,
          report: { type: "failure", error },
        };
      }

      case DeviceActionStatus.Error: {
        const jobState = mapDeviceActionErrorToFailureJobState(state.error);
        const isReplayableByTheUser = jobState.type === "device-rejected";

        return isReplayableByTheUser
          ? { kind: "state", jobState, terminal: false }
          : {
              kind: "state",
              jobState,
              terminal: true,
              report: { type: "failure", error: jobState.error },
            };
      }
    }
  };
}

/**
 * Edit an external address on the device. The device serves identifier and scope
 * as two commands, so an edit touching both runs as a chain: each `hmacRest`
 * covers one `(identifier, scope)` pair, and the identifier step yields exactly
 * the proof the scope step must present.
 */
export const editExternalAddressIntentJob: Job<
  EditExternalAddressJobState,
  EditExternalAddressIntentInput,
  ContactIntentResult<EditExternalAddressResult>
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) => {
  const reporter = createContactIntentResultReporter(onResult);
  const retries = new Subject<void>();
  const deviceModelId = deviceConnectionResult.connectedDevice.modelId;
  const deviceName = deviceConnectionResult.compatDeviceName;

  const scopeChanges = input.newScope !== input.previousScope;
  const identifierChanges = input.newAddress !== input.previousAddress;
  const nothingChanges = !identifierChanges && !scopeChanges;

  const toResult = (hmacRest: Uint8Array): EditExternalAddressResult => ({
    contactName: input.contactName,
    scope: input.newScope,
    address: input.newAddress,
    blockchainFamily: input.blockchainFamily,
    chainId: input.chainId,
    groupHandle: input.groupHandle,
    hmacProof: input.hmacProof,
    hmacRest: mapBytesToProof(hmacRest),
  });

  return defer(() => {
    if (nothingChanges) {
      reporter.report({ type: "success", result: toResult(mapProofToBytes(input.hmacRest)) });
      return of<EditExternalAddressJobState>({ type: "completed" });
    }

    let groupHandle: Uint8Array;
    let hmacProof: Uint8Array;
    let storedHmacRest: Uint8Array;
    let previousIdentifier: Uint8Array;
    let newIdentifier: Uint8Array;
    let chainId: bigint;
    try {
      groupHandle = mapGroupHandleToBytes(input.groupHandle);
      hmacProof = mapProofToBytes(input.hmacProof);
      storedHmacRest = mapProofToBytes(input.hmacRest);
      previousIdentifier = mapIdentifierToBytes(input.previousAddress);
      newIdentifier = mapIdentifierToBytes(input.newAddress);
      chainId = mapChainIdToBigInt(input.chainId);
    } catch (error) {
      const failure = { type: "invalid-input", error: mapDmkErrorToError(error) } as const;
      reporter.report({ type: "failure", error: failure.error });
      return of<EditExternalAddressJobState>(failure);
    }

    const coinAppFamily = deviceExtractedContext.currentAppName.toLowerCase();
    const scopeOnRecord = input.previousScope;

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      appName: deviceExtractedContext.currentAppName,
    }).build();

    function runStep(
      deviceAction: Observable<DeviceActionState>,
      awaitingConfirmation: EditExternalAddressJobState,
      next: (hmacRest: Uint8Array) => Observable<EditExternalAddressJobState>,
    ): Observable<EditExternalAddressJobState> {
      const toOutcome = createStepOutcomeMapper(awaitingConfirmation);

      return deviceAction.pipe(
        map(toOutcome),
        takeWhile(outcome => outcome.kind !== "proof" && !outcome.terminal, true),
        concatMap(outcome => {
          if (outcome.kind === "proof") return next(outcome.hmacRest);
          if (outcome.report) reporter.report(outcome.report);
          return of(outcome.jobState);
        }),
      );
    }

    function identifierStep(hmacRest: Uint8Array): Observable<DeviceActionState> {
      const deviceActionInput: EditExternalAddressIdentifierKitInput = {
        contactName: input.contactName,
        scope: scopeOnRecord,
        previousIdentifier,
        newIdentifier,
        blockchainFamily: coinAppFamily,
        chainId,
        groupHandle,
        hmacProof,
        hmacRest,
        skipOpenApp: true,
      };

      return createDeviceActionObservable(() =>
        contactsManager.editExternalAddressIdentifier(deviceActionInput),
      );
    }

    function scopeStep(hmacRest: Uint8Array): Observable<DeviceActionState> {
      const deviceActionInput: EditExternalAddressScopeKitInput = {
        contactName: input.contactName,
        previousScope: input.previousScope,
        newScope: input.newScope,
        // Unchanged by a scope-only edit, already rotated when the chain ran the
        // identifier step first — either way it is what the device now holds.
        identifier: newIdentifier,
        blockchainFamily: coinAppFamily,
        chainId,
        groupHandle,
        hmacProof,
        hmacRest,
        skipOpenApp: true,
      };

      return createDeviceActionObservable(() =>
        contactsManager.editExternalAddressScope(deviceActionInput),
      );
    }

    const complete = (hmacRest: Uint8Array): Observable<EditExternalAddressJobState> => {
      reporter.report({ type: "success", result: toResult(hmacRest) });
      return of<EditExternalAddressJobState>({ type: "completed" });
    };

    const awaitingIdentifier: EditExternalAddressJobState = {
      type: "awaiting-device-confirmation",
      step: "identifier",
      deviceModelId,
      deviceName,
    };
    const awaitingScope: EditExternalAddressJobState = {
      type: "awaiting-device-confirmation",
      step: "scope",
      deviceModelId,
      deviceName,
    };

    const runEdit = (): Observable<EditExternalAddressJobState> => {
      const scopeOnly = (hmacRest: Uint8Array) =>
        runStep(scopeStep(hmacRest), awaitingScope, complete);

      if (!scopeChanges) {
        return runStep(identifierStep(storedHmacRest), awaitingIdentifier, complete);
      }
      if (!identifierChanges) {
        return scopeOnly(storedHmacRest);
      }
      return runStep(identifierStep(storedHmacRest), awaitingIdentifier, hmacRest =>
        concat(of<EditExternalAddressJobState>({ type: "partial-result" }), scopeOnly(hmacRest)),
      );
    };

    return retries.pipe(
      startWith(undefined),
      // A retry restarts the whole chain from the stored proof, which the device
      // still accepts: it never recorded the intermediate step.
      switchMap(runEdit),
      // `retries` never completes, so the job's end has to come from its states.
      takeWhile(jobState => OPEN_JOB_STATE_TYPES.has(jobState.type), true),
    );
  }).pipe(
    map(jobState =>
      jobState.type === "device-rejected" ? { ...jobState, retry: () => retries.next() } : jobState,
    ),
    // Jobs report failures as a terminal JobState rather than erroring the
    // observable, which would drop the executor into its generic fallback
    // instead of this intent's own InfoState.
    catchError((error: unknown) => {
      const mapped = mapDmkErrorToError(error);
      reporter.report({ type: "failure", error: mapped });
      return of<EditExternalAddressJobState>({ type: "failed", error: mapped });
    }),
    reporter.cancelOnUnsubscribe(),
  );
};
