import { useContactsReduxContext } from "./useContactsReduxContext";
import {
  createMockContactSignerValidationPort,
  type ContactSignerValidationPort,
} from "../platform/contactSignerValidationPort";
import { useMemo } from "react";
import { createContactAddressDetailEditFlowPorts } from "../steps/Detail/createContactAddressDetailEditFlowPorts";
import type { ContactAddressDetailEditFlowPorts } from "../steps/Detail/model/ports";

export function useContactsAddressEditPorts(
  signerValidation?: ContactSignerValidationPort,
): ContactAddressDetailEditFlowPorts {
  const { dispatch, getState } = useContactsReduxContext();
  const resolvedSignerValidation = useMemo(
    () => signerValidation ?? createMockContactSignerValidationPort(),
    [signerValidation],
  );

  return useMemo(
    () =>
      createContactAddressDetailEditFlowPorts({
        dispatch,
        getState,
        signerValidation: resolvedSignerValidation,
      }),
    [dispatch, getState, resolvedSignerValidation],
  );
}
