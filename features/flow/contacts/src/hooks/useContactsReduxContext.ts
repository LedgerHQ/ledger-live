import { selectContactById } from "@domain/entity-contact";
import { useCallback, useMemo } from "react";
import { useDispatch, useStore } from "react-redux";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactsReduxContext() {
  const dispatch = useDispatch();
  const store = useStore();
  const getState = useCallback(() => store.getState() as ContactsStateRoot, [store]);

  return useMemo(() => ({ dispatch, getState }), [dispatch, getState]);
}
