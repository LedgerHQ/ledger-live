import { handleActions, ReducerMap } from "redux-actions";
import type { Action } from "redux-actions";

import {
  ProtectActionTypes,
  ProtectPayload,
  ProtectDataPayload,
  ProtectStatusPayload,
} from "../actions/types";
import type { ProtectState, State } from "./types";
import { ProtectStateNumberEnum } from "../components/ServicesWidget/types";

export const INITIAL_STATE: ProtectState = {
  data: {
    services: {
      Protect: {
        available: true,
        active: false,
        paymentDue: false,
        subscribedAt: 0,
        lastPaymentDate: 0,
      },
    },
    accessToken: "",
    expiresIn: 0,
    refreshExpiresIn: 0,
    refreshToken: "",
    tokenType: "Bearer",
  },
  protectStatus: ProtectStateNumberEnum.NEW,
};

const handlers: ReducerMap<ProtectState, ProtectPayload> = {
  [ProtectActionTypes.UPDATE_PROTECT_STATUS]: (state, action) => ({
    ...state,
    protectStatus: (action as Action<ProtectStatusPayload>).payload,
  }),
  [ProtectActionTypes.UPDATE_DATA]: (state, action) => ({
    ...state,
    data: (action as Action<ProtectDataPayload>).payload,
  }),
  [ProtectActionTypes.RESET_STATE]: () => INITIAL_STATE,
};

// Selectors

export const protectSelector = (s: State): ProtectState => {
  return s.protect;
};

export default handleActions<ProtectState, ProtectPayload>(
  handlers,
  INITIAL_STATE,
);
