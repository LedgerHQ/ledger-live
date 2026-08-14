import { useMemo } from "react";
import { createContactDetailActionsPorts } from "../steps/Detail/createContactDetailActionsPorts";
import type { ContactDetailActionsPorts } from "../steps/Detail/model/ports";
import { useContactsReduxContext } from "./useContactsReduxContext";

export function useContactsEditDeletePorts(): ContactDetailActionsPorts {
  const { dispatch, getState } = useContactsReduxContext();

  return useMemo(
    () => createContactDetailActionsPorts({ dispatch, getState }),
    [dispatch, getState],
  );
}
