import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { RatingsState, State } from "./types";
import type {
  RatingsDataOfUserPayload,
  RatingsPayload,
  RatingsSetCurrentRouteNamePayload,
  RatingsSetHappyMomentPayload,
  RatingsSetModalLockedPayload,
  RatingsSetModalOpenPayload,
} from "../actions/types";
import { RatingsActionTypes } from "../actions/types";

export const INITIAL_STATE = {
  isRatingsModalOpen: false,
  currentRouteName: null,
  happyMoment: undefined,
  dataOfUser: undefined,
  isRatingsModalLocked: false,
};
const handlers: ReducerMap<RatingsState, RatingsPayload> = {
  [RatingsActionTypes.RATINGS_SET_MODAL_OPEN]: (state, action) => ({
    ...state,
    isRatingsModalOpen: (action as Action<RatingsSetModalOpenPayload>).payload
      .isRatingsModalOpen,
  }),

  [RatingsActionTypes.RATINGS_SET_MODAL_LOCKED]: (state, action) => ({
    ...state,
    isRatingsModalLocked: (action as Action<RatingsSetModalLockedPayload>)
      .payload.isRatingsModalLocked,
  }),

  [RatingsActionTypes.RATINGS_SET_CURRENT_ROUTE_NAME]: (state, action) => ({
    ...state,
    currentRouteName: (action as Action<RatingsSetCurrentRouteNamePayload>)
      .payload.currentRouteName,
  }),

  [RatingsActionTypes.RATINGS_SET_HAPPY_MOMENT]: (state, action) => ({
    ...state,
    happyMoment: (action as Action<RatingsSetHappyMomentPayload>).payload
      .happyMoment,
  }),

  [RatingsActionTypes.RATINGS_SET_DATA_OF_USER]: (state, action) => ({
    ...state,
    dataOfUser: (action as Action<RatingsDataOfUserPayload>).payload.dataOfUser,
  }),
};

// Selectors
export const ratingsModalOpenSelector = (s: State) =>
  s.ratings.isRatingsModalOpen;
export const ratingsModalLockedSelector = (s: State) =>
  s.ratings.isRatingsModalLocked;
export const ratingsCurrentRouteNameSelector = (s: State) =>
  s.ratings.currentRouteName;
export const ratingsHappyMomentSelector = (s: State) => s.ratings.happyMoment;
export const ratingsDataOfUserSelector = (s: State) => s.ratings.dataOfUser;
export const satisfactionSelector = (s: State) =>
  s.ratings.dataOfUser?.satisfaction;

export default handleActions<RatingsState, RatingsPayload>(
  handlers,
  INITIAL_STATE,
);
