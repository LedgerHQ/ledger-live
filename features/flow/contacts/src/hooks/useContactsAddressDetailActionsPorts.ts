import { selectContactAddressById } from "@domain/entity-contact";
import type { ContactDeviceIntentsPort } from "@features/platform-contacts";
import { useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../platform/contactSignerValidationPort";
import { createContactAddressDetailActionsPorts } from "../steps/Detail/createContactAddressDetailActionsPorts";
import type { ContactAddressDetailActionsPorts } from "../steps/Detail/model/ports";

type ContactsStateRoot = Parameters<typeof selectContactAddressById>[0];

export function useContactsAddressDetailActionsPorts(
  deviceIntents: ContactDeviceIntentsPort,
  signerValidation?: ContactSignerValidationPort,
): ContactAddressDetailActionsPorts {
  const dispatch = useDispatch();
  const store = useStore();
  const resolvedSignerValidation = useMemo(
    () => signerValidation ?? createMockContactSignerValidationPort(),
    [signerValidation],
  );

  return useMemo(
    () => ({
      ...createContactAddressDetailActionsPorts({
        dispatch,
        getState: () => store.getState() as ContactsStateRoot,
        deviceIntents,
      }),
      signerValidation: resolvedSignerValidation,
    }),
    [deviceIntents, dispatch, resolvedSignerValidation, store],
  );
}
