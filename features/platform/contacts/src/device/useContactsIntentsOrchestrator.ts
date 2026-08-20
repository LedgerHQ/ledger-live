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
import {
  createEditExternalAddressOperation,
  createRegisterExternalAddressOperation,
  createRenameExternalContactOperation,
} from "./operations";
import { SingleFlightRequestController } from "./singleFlightRequestController";
import type {
  ContactDeviceIntent,
  ContactDeviceIntentInput,
  ContactDeviceIntentJobState,
  ContactOperation,
  ContactsDeviceInitializationInput,
  ContactsDeviceIntentExecutorProps,
} from "./types";

const DEVICE_CONNECTION_PARAMS = { acceptedDeviceModelIds: [] };

const createContactIntent = createIntent as <JobState, Input, ExtraProps>(
  definition: IntentPlatformDefinition<JobState, Input, ExtraProps>,
  input: Input,
  listeners?: IntentListeners<JobState>,
) => Intent<JobState, Input, ExtraProps>;

type ActiveIntent = Readonly<{
  requestId: number;
  intent: ContactDeviceIntent;
  initializationInput: ContactsDeviceInitializationInput;
}>;

export type ContactsIntentsOrchestrator = Readonly<{
  deviceIntents: ContactDeviceIntentsPort;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
}>;

export function useContactsIntentsOrchestrator(): ContactsIntentsOrchestrator {
  const controllerRef = useRef(new SingleFlightRequestController());
  const [activeIntent, setActiveIntent] = useState<ActiveIntent>();

  const clearActiveIntent = useCallback((requestId: number) => {
    setActiveIntent(current => (current?.requestId === requestId ? undefined : current));
  }, []);

  const execute = useCallback(
    <JobState extends ContactDeviceIntentJobState, Input extends ContactDeviceIntentInput, Result>(
      operation: ContactOperation<JobState, Input, Result>,
    ): Promise<Result> => {
      const request = controllerRef.current.start(operation.classify);
      const intent = createContactIntent(operation.definition, operation.input, {
        onJobStateChanged: request.capture,
        onJobComplete: () => {
          if (request.complete()) {
            clearActiveIntent(request.id);
          }
        },
        onJobError: error => {
          if (request.fail(error)) {
            clearActiveIntent(request.id);
          }
        },
      });

      setActiveIntent({
        requestId: request.id,
        intent: intent as unknown as ContactDeviceIntent,
        initializationInput: operation.initializationInput,
      });

      return request.promise;
    },
    [clearActiveIntent],
  );

  const editExternalAddress = useCallback(
    async (input: EditExternalAddressInput): Promise<EditExternalAddressResult> => {
      const request = createEditExternalAddressOperation(input);
      switch (request.type) {
        case "immediate":
          return request.result;
        case "identifier":
          return execute(request.operation);
        case "scope":
          return execute(request.operation);
        case "combined":
          return execute(request.operation);
      }
    },
    [execute],
  );

  const deviceIntents = useMemo<ContactDeviceIntentsPort>(
    () => ({
      registerExternalAddress: async input =>
        execute(createRegisterExternalAddressOperation(input)),
      renameExternalContact: async input => execute(createRenameExternalContactOperation(input)),
      editExternalAddress,
    }),
    [editExternalAddress, execute],
  );

  const cancel = useCallback(() => {
    setActiveIntent(undefined);
    controllerRef.current.cancel();
  }, []);

  useEffect(
    () => () => {
      controllerRef.current.cancel();
    },
    [],
  );

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
      onIntentJobStateChanged: () => undefined,
      onIntentJobComplete: () => undefined,
      onIntentJobError: () => undefined,
      onUserCancel: cancel,
      cancelIntentRequestId: undefined,
    };
  }, [activeIntent, cancel]);

  return { deviceIntents, dieProps };
}
