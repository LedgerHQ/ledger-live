import { useMemo } from "react";
import { createContactEditPort, type ContactDeviceIntentsPort } from "@features/platform-contacts";
import { createContactDeletePort } from "@features/flow-contacts-delete-contact";
import type { ContactDetailActionsPorts } from "../steps/Detail/model/ports";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../platform/contactSignerValidationPort";
import { useContactsReduxContext } from "./useContactsReduxContext";

export function useContactsEditDeletePorts(
  deviceIntents: ContactDeviceIntentsPort,
  signerValidation?: ContactSignerValidationPort,
): ContactDetailActionsPorts {
  const { dispatch, getState } = useContactsReduxContext();
  const resolvedSignerValidation = useMemo(
    () => signerValidation ?? createMockContactSignerValidationPort(),
    [signerValidation],
  );

  return useMemo(
    () => ({
      edit: createContactEditPort({ dispatch, getState, deviceIntents }),
      deletion: createContactDeletePort({ dispatch }),
      signerValidation: resolvedSignerValidation,
    }),
    [deviceIntents, dispatch, getState, resolvedSignerValidation],
  );
}
