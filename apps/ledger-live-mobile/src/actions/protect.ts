import { createAction } from "redux-actions";
import { ProtectStateNumberEnum } from "../components/ServicesWidget/types";
import { ProtectData } from "../reducers/types";
import {
  ProtectActionTypes,
  ProtectDataPayload,
  ProtectStatusPayload,
} from "./types";

const updateProtectDataAction = createAction<ProtectDataPayload>(
  ProtectActionTypes.UPDATE_DATA,
);

export const updateProtectData = (data: ProtectData) => {
  return updateProtectDataAction({ data });
};

const updateProtectStatusAction = createAction<ProtectStatusPayload>(
  ProtectActionTypes.UPDATE_PROTECT_STATUS,
);

export const updateProtectStatus = (protectStatus: ProtectStateNumberEnum) => {
  return updateProtectStatusAction({ protectStatus });
};

const resetProtectStateAction = createAction(ProtectActionTypes.RESET_STATE);

export const resetProtectState = () => {
  return resetProtectStateAction();
};
