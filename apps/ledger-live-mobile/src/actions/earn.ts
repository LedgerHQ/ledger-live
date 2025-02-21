import { createAction } from "redux-actions";
import { EarnActionTypes } from "./types";
import type { EarnSetInfoModalPayload, EarnSetMenuModalPayload } from "./types";

export const makeSetEarnInfoModalAction = createAction<EarnSetInfoModalPayload>(
  EarnActionTypes.EARN_INFO_MODAL,
);

export const makeSetEarnMenuModalAction = createAction<EarnSetMenuModalPayload>(
  EarnActionTypes.EARN_MENU_MODAL,
);
