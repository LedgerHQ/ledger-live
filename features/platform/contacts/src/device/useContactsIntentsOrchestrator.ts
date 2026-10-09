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

/** Covers the queued sheet's own dismiss fallback, so a sheet that never presented still clears. */
const SHEET_DISMISS_WAIT_MS = 700;

export type ContactsIntentsOrchestrator = Readonly<{
  deviceIntents: ContactDeviceIntentsPort;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
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
   * After success, leave the executor mounted with `enabled: false` until
   * `dismissDeviceSheet`. Unmounting during the sheet's open animation leaves
   * the native modal on screen.
   */
  retainUntilSheetDismissed?: boolean;
}>;

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
            // Success is the only outcome with nothing left to show. Hosts that
            // present a sheet keep the executor until that sheet has closed:
            // unmounting it mid-open leaves the native modal up.
            if (retainUntilSheetDismissedRef.current) {
              isClosingRef.current = true;
              setActiveIntent(current =>
                current === undefined ? current : { ...current, status: "closing" },
              );
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
    async (input: EditExternalAddressInput): Promise<EditExternalAddressResult> => {
      const operation = createEditExternalAddressOperation(input, intents.editExternalAddress);
      return operation === null ? input.address.device : execute(operation);
    },
    [execute, intents.editExternalAddress],
  );

  const deviceIntents = useMemo<ContactDeviceIntentsPort>(
    () => ({
      registerExternalAddress: async input =>
        execute(createRegisterExternalAddressOperation(input, intents.registerExternalAddress)),
      renameExternalContact: async input =>
        execute(createRenameExternalContactOperation(input, intents.renameExternalContact)),
      editExternalAddress,
    }),
    [editExternalAddress, execute, intents.registerExternalAddress, intents.renameExternalContact],
  );

  const dismissDeviceSheet = useCallback(() => {
    isClosingRef.current = false;
    setActiveIntent(undefined);
  }, []);

  const cancel = useCallback(() => {
    if (isClosingRef.current) return;
    activeIntent?.cancel();
    isClosingRef.current = false;
    setActiveIntent(undefined);
  }, [activeIntent]);

  useEffect(() => {
    if (activeIntent?.status !== "closing") return;
    const timeoutId = setTimeout(dismissDeviceSheet, SHEET_DISMISS_WAIT_MS);
    return () => clearTimeout(timeoutId);
  }, [activeIntent, dismissDeviceSheet]);

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
      enabled: activeIntent.status === "running",
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

  return { deviceIntents, dieProps, dismissDeviceSheet };
}
