import { createAction } from "redux-actions";
import {
  ProtectActionTypes,
  ProtectDataPayload,
  ProtectStatusPayload,
} from "./types";

export const updateProtectData = createAction<ProtectDataPayload>(
  ProtectActionTypes.UPDATE_DATA,
);
export const updateProtectStatus = createAction<ProtectStatusPayload>(
  ProtectActionTypes.UPDATE_PROTECT_STATUS,
);
export const resetProtectState = createAction(ProtectActionTypes.RESET_STATE);
