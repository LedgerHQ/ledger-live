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

/**
 * A step either yields the device's rotated proof, or ends the whole edit with
 * a job state. There is no third case: the device is an HMAC oracle, so a step
 * that does not produce a proof has changed nothing.
 */
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

/**
 * States the job can emit and still have work left. Everything else ends it.
 *
 * `device-rejected` is here because the user can replay it, and `partial-result`
 * because the scope step follows it. Listing the open states rather than the
 * terminal ones keeps the failure taxonomy — which is almost entirely terminal,
 * and shared with the other intents — out of this decision.
 */
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

/**
 * Maps one device action's states onto this job's own vocabulary. Both steps
 * share it: they differ only in which confirmation state they publish, and
 * their DMK state shapes are structurally identical.
 */
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

        // A rejection is the one failure the user can undo, so it stays open
        // and carries the replay handle instead of settling the port promise.
        // Because the device holds no state, replaying is always safe — even
        // mid-chain, the proofs the host stored are still the valid ones.
        return jobState.type === "device-rejected"
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
 * Edit an external address on the device via the Contacts kit's
 * `ContactsManager.editExternalAddressIdentifier()` and
 * `ContactsManager.editExternalAddressScope()`.
 *
 * The port models this as one "edit" covering both the entry's identifier and
 * its scope, but the device serves them as two separate commands, so an edit
 * touching both runs as a chain: identifier first, then scope.
 *
 * The device stores nothing — it verifies the proof it is given, asks the user,
 * and returns a fresh one. Each `hmacRest` therefore covers one specific
 * `(identifier, scope)` pair, which is what dictates the chain's shape: the
 * identifier step proves `(previousAddress, previousScope)` and yields a proof
 * over `(newAddress, previousScope)`, which is exactly what the scope step must
 * present to yield the final proof over `(newAddress, newScope)`.
 *
 * That same statelessness is why an abandoned edit needs no recovery: dropping
 * an intermediate proof leaves the host's stored triple untouched and still
 * valid, so the whole chain is atomic from the host's point of view.
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

  /**
   * Echoes the caller's own representations, not the kit's, so the persisted
   * record stays in Ledger Wallet's own conventions (family taxonomy, chainId
   * representation) rather than the kit's wire-level ones. Only the
   * address-level proof rotates; the group-level name proof passes through.
   */
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
    // Neither field changed, so there is nothing to prove and nothing to
    // confirm. Settle with the caller's own proof rather than spending a
    // device prompt to rotate it for no reason.
    if (!identifierChanges && !scopeChanges) {
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

    // The kit's family table is keyed by the lowercased coin-app name (e.g.
    // "ethereum"), distinct from Ledger Wallet's own family grouping (e.g.
    // "evm") carried in `input.blockchainFamily`.
    const blockchainFamily = deviceExtractedContext.currentAppName.toLowerCase();

    const contactsManager = new ContactsManagerBuilder({
      dmk: deviceConnectionResult.dmk,
      sessionId: deviceConnectionResult.sessionId,
      appName: deviceExtractedContext.currentAppName,
    }).build();

    /**
     * Runs one step and turns its trailing outcome into the rest of the edit.
     * `next` receives the rotated proof; a step that ends the edit instead
     * short-circuits it.
     */
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

    /**
     * `scope` names the entry as the device is asked to verify it, so it is the
     * scope currently on record — an identifier edit never moves the scope, and
     * in the combined chain this step runs first.
     */
    function identifierStep(hmacRest: Uint8Array): Observable<DeviceActionState> {
      const deviceActionInput: EditExternalAddressIdentifierKitInput = {
        contactName: input.contactName,
        scope: input.previousScope,
        previousIdentifier,
        newIdentifier,
        blockchainFamily,
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

    /**
     * `identifier` is the entry's identifier as the device must verify it:
     * unchanged by a scope-only edit, and already rotated when a preceding
     * identifier step produced the `hmacRest` handed in here.
     */
    function scopeStep(hmacRest: Uint8Array): Observable<DeviceActionState> {
      const deviceActionInput: EditExternalAddressScopeKitInput = {
        contactName: input.contactName,
        previousScope: input.previousScope,
        newScope: input.newScope,
        identifier: newIdentifier,
        blockchainFamily,
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
        // The identifier half is approved. Nothing is persisted here: the
        // proof only matters as the scope step's input, and abandoning now
        // leaves the host's stored record untouched and still valid.
        concat(of<EditExternalAddressJobState>({ type: "partial-result" }), scopeOnly(hmacRest)),
      );
    };

    return retries.pipe(
      startWith(undefined),
      // switchMap tears down the superseded attempt before starting the next,
      // so replaying needs no run bookkeeping of its own. A retry restarts the
      // whole chain from the stored proof, which the device will still accept:
      // it never recorded the intermediate step.
      switchMap(runEdit),
      // `retries` never completes, so the job's own end has to come from the
      // states flowing through it.
      takeWhile(jobState => OPEN_JOB_STATE_TYPES.has(jobState.type), true),
    );
  }).pipe(
    // A rejection is reported without a replay handle above, because only here
    // is the retry that reaches the outer chain in scope.
    map(jobState =>
      jobState.type === "device-rejected" ? { ...jobState, retry: () => retries.next() } : jobState,
    ),
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
    reporter.cancelOnUnsubscribe(),
  );
};
