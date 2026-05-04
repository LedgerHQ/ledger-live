import { createAction } from "redux-actions";
import { EarnActionTypes } from "./types";
import type {
  EarnSetInfoModalPayload,
  EarnSetInfoBottomSheetPayload,
  EarnSetMenuModalPayload,
  EarnSetMenuBottomSheetPayload,
  EarnSetProtocolInfoModalPayload,
  EarnSetActionDialogPayload,
} from "./types";

export const makeSetEarnInfoModalAction = createAction<EarnSetInfoModalPayload>(
  EarnActionTypes.EARN_INFO_MODAL,
);

export const makeSetEarnInfoBottomSheetAction = createAction<EarnSetInfoBottomSheetPayload>(
  EarnActionTypes.EARN_INFO_BOTTOM_SHEET,
);

export const makeSetEarnMenuModalAction = createAction<EarnSetMenuModalPayload>(
  EarnActionTypes.EARN_MENU_MODAL,
);

export const makeSetEarnMenuBottomSheetAction = createAction<EarnSetMenuBottomSheetPayload>(
  EarnActionTypes.EARN_MENU_BOTTOM_SHEET,
);

export const makeSetEarnProtocolInfoModalAction = createAction<EarnSetProtocolInfoModalPayload>(
  EarnActionTypes.EARN_PROTOCOL_INFO_MODAL,
);

export const makeSetEarnActionDialogAction = createAction<EarnSetActionDialogPayload>(
  EarnActionTypes.EARN_ACTION_DIALOG,
);
