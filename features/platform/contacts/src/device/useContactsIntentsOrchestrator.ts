import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createIntent,
  type Intent,
  type IntentListeners,
  type IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  ContactDeviceIntentsPort,
  EditExternalAddressInput,
  EditExternalAddressResult,
} from "../contactDeviceIntentsPort";
import { composeContactsGetMinVersion, type ContactsGetMinVersion } from "./contactsMinVersion";
import { ContactDeviceIntentCancelledError, ContactDeviceIntentMissingResultError } from "./errors";
import { createEditExternalAddressOperation } from "./operations/editExternalAddress";
import { createRegisterExternalAddressOperation } from "./operations/registerExternalAddress";
import { createRenameExternalContactOperation } from "./operations/renameExternalContact";
import type {
  ContactDeviceIntent,
  ContactDeviceIntentInput,
  ContactDeviceIntentJobState,
  ContactOperation,
  ContactsDeviceInitializationInput,
  ContactsIntentPlatformDefinitions,
} from "./types";
import type { ContactsDeviceIntentExecutorProps } from "./ContactsDeviceIntentExecutorProps";

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

const createContactIntent = createIntent as <JobState, Input, ExtraProps, Result>(
  definition: IntentPlatformDefinition<JobState, Input, ExtraProps, Result>,
  input: Input,
  listeners?: IntentListeners<JobState, Result>,
) => Intent<JobState, Input, ExtraProps, Result>;

type ActiveIntent = Readonly<{
  intent: ContactDeviceIntent;
  initializationInput: ContactsDeviceInitializationInput;
  cancel: () => void;
  status: "running" | "closing";
}>;

export type ContactsIntentsOrchestrator = Readonly<{
  deviceIntents: ContactDeviceIntentsPort;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
  /**
   * Whether the device sheet should be on screen. Turns false on success while the executor
   * stays enabled, so a sheet that has not opened is never presented empty.
   */
  isDeviceSheetRequested: boolean;
  /** Clears an executor kept up after success until its sheet has left the screen. */
  dismissDeviceSheet: () => void;
}>;

export type UseContactsIntentsOrchestratorParams = Readonly<{
  /**
   * The platform definitions for the Contacts device operations. Each app owns
   * its intent renderers, so it composes these from the shared
   * `IntentDefinition`s and passes them in. Tests inject mock definitions to
   * assert orchestration without running the real jobs.
   */
  intents: ContactsIntentPlatformDefinitions;

  /**
   * The host's app-global version floor (e.g. `getMinVersion` from
   * `libs/ledger-live-common/src/apps/support.ts`). Composed here with the
   * Contacts kit's own floor into the per-flow floor DIE Phase 2
   * (`ensureAppReadyUseCase`) enforces, via `initializerConfig`.
   */
  getLiveConfigMinVersion?: ContactsGetMinVersion;

  /**
   * After success, leave the executor mounted until `dismissDeviceSheet`. The sheet stops
   * being requested immediately.
   */
  retainUntilSheetDismissed?: boolean;
}>;

function closingIntent(current: ActiveIntent | undefined): ActiveIntent | undefined {
  if (current === undefined || current.status === "closing") return current;
  return { ...current, status: "closing" };
}

export function useContactsIntentsOrchestrator({
  intents,
  getLiveConfigMinVersion,
  retainUntilSheetDismissed = false,
}: UseContactsIntentsOrchestratorParams): ContactsIntentsOrchestrator {
  const [activeIntent, setActiveIntent] = useState<ActiveIntent>();
  const retainUntilSheetDismissedRef = useRef(retainUntilSheetDismissed);
  retainUntilSheetDismissedRef.current = retainUntilSheetDismissed;
  const isClosingRef = useRef(false);

  const getMinVersion = useMemo(
    () => composeContactsGetMinVersion(getLiveConfigMinVersion),
    [getLiveConfigMinVersion],
  );

  const execute = useCallback(
    <
      JobState extends ContactDeviceIntentJobState,
      Input extends ContactDeviceIntentInput,
      IntentResult,
      Result,
    >(
      operation: ContactOperation<JobState, Input, IntentResult, Result>,
    ): Promise<Result> =>
      new Promise<Result>((resolve, reject) => {
        let hasSettled = false;

        /**
         * Fails the flow's promise and leaves the DIE alone. Whatever the
         * executor has on screen — the intent's own failure state, or its
         * generic fallback — is the error UI, so it has to stay up until the
         * user dismisses it.
         */
        const fail = (error: unknown) => {
          if (hasSettled) {
            return;
          }
          hasSettled = true;
          reject(error);
        };

        const intent = createContactIntent(operation.intentDefinition, operation.intentInput, {
          /**
           * The job's result reporter reports exactly once per run and covers
           * every outcome — success, each failure `JobState`, and teardown — so
           * this is the only listener carrying flow semantics.
           * `mapIntentResultToResult` throws on a reported failure, which is
           * what separates the two branches below.
           */
          onResult: report => {
            if (hasSettled) {
              return;
            }
            let result: Result;
            try {
              result = operation.mapIntentResultToResult(report);
            } catch (error) {
              fail(error);
              return;
            }
            hasSettled = true;
            resolve(result);
            // Success has nothing left to show. Stop requesting the sheet, but keep the
            // executor enabled: disabling it renders the sheet empty, and unmounting that
            // empty sheet while iOS is still presenting it leaves the modal up.
            if (retainUntilSheetDismissedRef.current) {
              isClosingRef.current = true;
              setActiveIntent(closingIntent);
              return;
            }
            setActiveIntent(undefined);
          },
          // A job that completes without reporting, or that lets its observable
          // error, has broken the reporter's contract. Neither is reachable for
          // a job built on `createContactIntentResultReporter`, but rejecting
          // keeps such a bug from hanging the caller's promise forever.
          onJobComplete: () => fail(new ContactDeviceIntentMissingResultError()),
          onJobError: fail,
        });

        isClosingRef.current = false;
        setActiveIntent({
          intent: intent as unknown as ContactDeviceIntent,
          initializationInput: operation.initializationInput,
          status: "running",
          // Dismissed (or unmounted) before the job settled: nothing else will
          // settle the promise. Clearing `activeIntent` is the dismissal's own
          // job, not this callback's.
          cancel: () => fail(new ContactDeviceIntentCancelledError()),
        });
      }),
    [],
  );

  const editExternalAddress = useCallback(
    (input: EditExternalAddressInput): Promise<EditExternalAddressResult> => {
      const operation = createEditExternalAddressOperation(input, intents.editExternalAddress);
      return operation === null ? Promise.resolve(input.address.device) : execute(operation);
    },
    [execute, intents.editExternalAddress],
  );

  const deviceIntents = useMemo<ContactDeviceIntentsPort>(
    () => ({
      registerExternalAddress: input =>
        execute(createRegisterExternalAddressOperation(input, intents.registerExternalAddress)),
      renameExternalContact: input =>
        execute(createRenameExternalContactOperation(input, intents.renameExternalContact)),
      editExternalAddress,
    }),
    [editExternalAddress, execute, intents.registerExternalAddress, intents.renameExternalContact],
  );

  const dismissDeviceSheet = useCallback(() => {
    isClosingRef.current = false;
    setActiveIntent(current => (current?.status === "closing" ? undefined : current));
  }, []);

  const cancel = useCallback(() => {
    if (isClosingRef.current) return;
    activeIntent?.cancel();
    isClosingRef.current = false;
    setActiveIntent(undefined);
  }, [activeIntent]);

  useEffect(() => {
    if (activeIntent === undefined) {
      return;
    }
    return activeIntent.cancel;
  }, [activeIntent]);

  const dieProps = useMemo<ContactsDeviceIntentExecutorProps | undefined>(() => {
    if (activeIntent === undefined) {
      return undefined;
    }

    return {
      enabled: true,
      deviceConnectionParams: DEVICE_CONNECTION_PARAMS,
      deviceInitializationInput: activeIntent.initializationInput,
      intent: activeIntent.intent,
      intentComponentExtraProps: undefined,
      onExecutorStateChanged: () => undefined,
      onUserCancel: cancel,
      cancelIntentRequestId: undefined,
      initializerConfig: { dependencies: { getMinVersion } },
    };
  }, [activeIntent, cancel, getMinVersion]);

  const isDeviceSheetRequested = activeIntent?.status === "running";

  return {
    deviceIntents,
    dieProps,
    isDeviceSheetRequested,
    dismissDeviceSheet,
  };
}
