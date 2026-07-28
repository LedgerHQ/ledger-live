import { useCallback, useState } from "react";
import type { ContactAddress, ContactId } from "@domain/entity-contact";
import type { AddAddressFlowState, AddAddressFlowViewModel } from "./types";

const CLOSED_ADD_ADDRESS_FLOW_STATE = {
  status: "closed",
} as const satisfies AddAddressFlowState;

export function useAddAddressFlowViewModel(): AddAddressFlowViewModel {
  const [state, setState] = useState<AddAddressFlowState>(CLOSED_ADD_ADDRESS_FLOW_STATE);
  const start = useCallback((selectedContactId: ContactId) => {
    setState({
      status: "selectingCurrency",
      selectedContactId,
    });
  }, []);
  const completeCurrencySelection = useCallback(
    (selectedContactId: ContactId, selectedCurrencyId: ContactAddress["currencyId"]) => {
      setState(currentState => {
        if (
          currentState.status !== "selectingCurrency" ||
          currentState.selectedContactId !== selectedContactId
        ) {
          return currentState;
        }

        return {
          status: "enteringAddress",
          selectedContactId,
          selectedCurrencyId,
        };
      });
    },
    [],
  );
  const close = useCallback(() => {
    setState(CLOSED_ADD_ADDRESS_FLOW_STATE);
  }, []);

  return {
    state,
    start,
    completeCurrencySelection,
    close,
  };
}
