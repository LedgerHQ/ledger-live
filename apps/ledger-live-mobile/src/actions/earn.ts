import { createAction } from "redux-actions";
import { EarnActionTypes } from "./types";
import type {
  EarnSetInfoModalPayload,
  EarnSetMenuModalPayload,
  EarnSetProtocolInfoModalPayload,
} from "./types";

export const makeSetEarnInfoModalAction = createAction<EarnSetInfoModalPayload>(
  EarnActionTypes.EARN_INFO_MODAL,
);

export const makeSetEarnMenuModalAction = createAction<EarnSetMenuModalPayload>(
  EarnActionTypes.EARN_MENU_MODAL,
);

export const makeSetEarnProtocolInfoModalAction = createAction<EarnSetProtocolInfoModalPayload>(
  EarnActionTypes.EARN_PROTOCOL_INFO_MODAL,
);
