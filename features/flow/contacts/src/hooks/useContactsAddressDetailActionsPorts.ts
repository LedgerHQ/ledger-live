import { selectContactAddressById } from "@domain/entity-contact";
import type { ContactDeviceIntentsPort, ContactsConfigResolver } from "@features/platform-contacts";
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
  getConfig: ContactsConfigResolver,
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
        getConfig,
      }),
      signerValidation: resolvedSignerValidation,
    }),
    [deviceIntents, dispatch, getConfig, resolvedSignerValidation, store],
  );
}
