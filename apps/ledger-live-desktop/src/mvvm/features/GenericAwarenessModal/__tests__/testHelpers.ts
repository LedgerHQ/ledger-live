import type { State } from "~/renderer/reducers";
import type { AppDispatch } from "~/state-manager/configureStore";
import {
  genericAwarenessModalInitialState,
  type GenericAwarenessModalSliceState,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  closeGenericAwarenessModalDialog,
  openGenericAwarenessModalDialog,
} from "../genericAwarenessModalDialog";

export const initialGenericAwarenessModalState: GenericAwarenessModalSliceState =
  genericAwarenessModalInitialState;

export const createGenericAwarenessModalTestState = (overrides: Partial<State> = {}): State =>
  ({
    genericAwarenessModal: initialGenericAwarenessModalState,
    settings: { dismissedContentCards: {} },
    dialogs: {},
    ...overrides,
  }) as State;

export const dispatchGenericAwarenessModalThunk = (
  store: { dispatch: unknown },
  thunk:
    | ReturnType<typeof openGenericAwarenessModalDialog>
    | ReturnType<typeof closeGenericAwarenessModalDialog>,
) => {
  (store.dispatch as AppDispatch)(thunk);
};
