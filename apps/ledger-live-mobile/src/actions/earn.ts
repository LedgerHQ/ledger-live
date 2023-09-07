import { createAction } from "redux-actions";
import { EarnActionTypes } from "./types";
import type { EarnSetInfoModalPayload } from "./types";

export const setEarnInfoModal = createAction<EarnSetInfoModalPayload>(
  EarnActionTypes.EARN_INFO_MODAL,
);

export const setIsDeepLinking = createAction<boolean>(EarnActionTypes.SET_IS_DEEP_LINKING);
