import type { Action, ReducerMap } from "redux-actions";
import { handleActions } from "redux-actions";
import { createSelector } from "~/context/selectors";
import {
  EarnActionTypes,
  EarnPayload,
  EarnSetInfoModalPayload,
  EarnSetInfoBottomSheetPayload,
  EarnSetMenuModalPayload,
  EarnSetMenuBottomSheetPayload,
  EarnSetProtocolInfoModalPayload,
  EarnSetActionDialogPayload,
} from "../actions/types";
import type { EarnState, State } from "./types";

export const INITIAL_STATE: EarnState = {
  infoModal: {},
  infoBottomSheet: undefined,
  menuModal: undefined,
  menuBottomSheet: undefined,
  protocolInfoModal: undefined,
  actionDialog: undefined,
};

const handlers: ReducerMap<EarnState, EarnPayload> = {
  [EarnActionTypes.EARN_INFO_MODAL]: (state, action): EarnState => ({
    ...state,
    infoModal: (action as Action<EarnSetInfoModalPayload>).payload ?? {},
  }),
  [EarnActionTypes.EARN_INFO_BOTTOM_SHEET]: (state, action): EarnState => ({
    ...state,
    infoBottomSheet: (action as Action<EarnSetInfoBottomSheetPayload>).payload,
  }),
  [EarnActionTypes.EARN_MENU_MODAL]: (state, action): EarnState => ({
    ...state,
    menuModal: (action as Action<EarnSetMenuModalPayload>).payload,
  }),
  [EarnActionTypes.EARN_MENU_BOTTOM_SHEET]: (state, action): EarnState => ({
    ...state,
    menuBottomSheet: (action as Action<EarnSetMenuBottomSheetPayload>).payload,
  }),
  [EarnActionTypes.EARN_PROTOCOL_INFO_MODAL]: (state, action): EarnState => ({
    ...state,
    protocolInfoModal: (action as Action<EarnSetProtocolInfoModalPayload>).payload,
  }),
  [EarnActionTypes.EARN_ACTION_DIALOG]: (state, action): EarnState => ({
    ...state,
    actionDialog: (action as Action<EarnSetActionDialogPayload>).payload,
  }),
};

const storeSelector = (state: State): EarnState => state.earn;

export const exportSelector = storeSelector;

export const earnInfoModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.infoModal,
);

export const earnInfoBottomSheetSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.infoBottomSheet,
);

export const earnMenuModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.menuModal,
);

export const earnMenuBottomSheetSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.menuBottomSheet,
);

export const earnProtocolInfoModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.protocolInfoModal,
);

export const earnActionDialogSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.actionDialog,
);

export default handleActions<EarnState, EarnPayload>(handlers, INITIAL_STATE);
