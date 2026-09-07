import { useCallback, useEffect, useMemo, useState } from "react";
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
}>;

export type ContactsIntentsOrchestrator = Readonly<{
  deviceIntents: ContactDeviceIntentsPort;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
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
}>;

export function useContactsIntentsOrchestrator({
  intents,
  getLiveConfigMinVersion,
}: UseContactsIntentsOrchestratorParams): ContactsIntentsOrchestrator {
  const [activeIntent, setActiveIntent] = useState<ActiveIntent>();

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
        let hasReportedResult = false;
        const intent = createContactIntent(operation.intentDefinition, operation.intentInput, {
          onResult: result => {
            if (hasReportedResult) {
              return;
            }
            hasReportedResult = true;
            try {
              resolve(operation.mapIntentResultToResult(result));
            } catch (error) {
              reject(error);
            }
          },
          onJobComplete: () => {
            if (!hasReportedResult) {
              hasReportedResult = true;
              reject(new ContactDeviceIntentMissingResultError());
            }
            setActiveIntent(undefined);
          },
          onJobError: error => {
            hasReportedResult = true;
            reject(error);
            setActiveIntent(undefined);
          },
        });

        setActiveIntent({
          intent: intent as unknown as ContactDeviceIntent,
          initializationInput: operation.initializationInput,
          cancel: () => {
            if (!hasReportedResult) {
              hasReportedResult = true;
              reject(new ContactDeviceIntentCancelledError());
            }
          },
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

  const cancel = useCallback(() => {
    activeIntent?.cancel();
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

  return { deviceIntents, dieProps };
}
