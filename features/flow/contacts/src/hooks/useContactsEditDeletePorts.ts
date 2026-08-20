import { useMemo } from "react";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { createContactDetailActionsPorts } from "../steps/Detail/createContactDetailActionsPorts";
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
      ...createContactDetailActionsPorts({ dispatch, getState, deviceIntents }),
      signerValidation: resolvedSignerValidation,
    }),
    [deviceIntents, dispatch, getState, resolvedSignerValidation],
  );
}
