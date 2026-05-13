import { useMemo, useState } from "react";
import { makeInitialAccount } from "../model/factories";
import type { TraderAccountState, TraderAssetId, TraderOpInput } from "../model/types";
import {
  withAssetId,
  withCurrentPrice,
  withRowAppended,
  withRowRemoved,
  withRowUpdated,
} from "./accountUpdaters";

export type SingleAccountActions = {
  setAssetId: (id: TraderAssetId) => void;
  setCurrentPrice: (value: string) => void;
  addRow: (values?: TraderOpInput) => void;
  setRow: (rowId: string, values: TraderOpInput) => void;
  removeRow: (rowId: string) => void;
};

export type UseSingleAccountState = {
  state: TraderAccountState;
  actions: SingleAccountActions;
};

export function useSingleAccountState(initialAssetId: TraderAssetId): UseSingleAccountState {
  const [state, setState] = useState<TraderAccountState>(() => makeInitialAccount(initialAssetId));

  // Actions are stable: closures only touch `setState`, never `state` directly.
  const actions = useMemo<SingleAccountActions>(
    () => ({
      setAssetId: id => setState(prev => withAssetId(prev, id)),
      setCurrentPrice: value => setState(prev => withCurrentPrice(prev, value)),
      addRow: values => setState(prev => withRowAppended(prev, values)),
      setRow: (rowId, values) => setState(prev => withRowUpdated(prev, rowId, values)),
      removeRow: rowId => setState(prev => withRowRemoved(prev, rowId)),
    }),
    [],
  );

  return { state, actions };
}
