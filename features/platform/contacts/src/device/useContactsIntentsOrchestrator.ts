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
import { ContactDeviceIntentCancelledError, ContactDeviceIntentMissingResultError } from "./errors";
import {
  createEditExternalAddressOperation,
  createRegisterExternalAddressOperation,
  createRenameExternalContactOperation,
} from "./operations";
import {
  editExternalAddressIntentPlatformDefinition,
  registerExternalAddressIntentPlatformDefinition,
  renameContactIntentPlatformDefinition,
} from "./intents";
import type {
  ContactDeviceIntent,
  ContactDeviceIntentInput,
  ContactDeviceIntentJobState,
  ContactOperation,
  ContactsDeviceInitializationInput,
  ContactsDeviceIntentExecutorProps,
} from "./types";

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

export function useContactsIntentsOrchestrator(): ContactsIntentsOrchestrator {
  const [activeIntent, setActiveIntent] = useState<ActiveIntent>();

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
      const operation = createEditExternalAddressOperation(
        input,
        editExternalAddressIntentPlatformDefinition,
      );
      return operation === null ? input.address.device : execute(operation);
    },
    [execute],
  );

  const deviceIntents = useMemo<ContactDeviceIntentsPort>(
    () => ({
      registerExternalAddress: async input =>
        execute(
          createRegisterExternalAddressOperation(
            input,
            registerExternalAddressIntentPlatformDefinition,
          ),
        ),
      renameExternalContact: async input =>
        execute(createRenameExternalContactOperation(input, renameContactIntentPlatformDefinition)),
      editExternalAddress,
    }),
    [editExternalAddress, execute],
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
    };
  }, [activeIntent, cancel]);

  return { deviceIntents, dieProps };
}
