import { selectContactById } from "@domain/entity-contact";
import { useMemo } from "react";
import { useDispatch, useStore } from "react-redux";
import { createContactDetailActionsPorts } from "../steps/Detail/createContactDetailActionsPorts";
import type { ContactDetailActionsPorts } from "../steps/Detail/model/ports";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactsEditDeletePorts(): ContactDetailActionsPorts {
  const dispatch = useDispatch();
  const store = useStore();

  return useMemo(
    () =>
      createContactDetailActionsPorts({
        dispatch,
        getState: () => store.getState() as ContactsStateRoot,
      }),
    [dispatch, store],
  );
}
