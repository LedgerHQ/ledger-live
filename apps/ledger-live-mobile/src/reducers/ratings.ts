import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
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

const initialState: RatingsState = {
  isRatingsModalOpen: false,
  currentRouteName: null,
  happyMoment: undefined,
  dataOfUser: undefined,
  isRatingsModalLocked: false,
};
const handlers = {
  [RatingsActionTypes.RATINGS_SET_MODAL_OPEN]: (
    state: RatingsState,
    { payload: { isRatingsModalOpen } }: Action<RatingsSetModalOpenPayload>,
  ) => ({ ...state, isRatingsModalOpen }),

  [RatingsActionTypes.RATINGS_SET_MODAL_LOCKED]: (
    state: RatingsState,
    { payload: { isRatingsModalLocked } }: Action<RatingsSetModalLockedPayload>,
  ) => ({ ...state, isRatingsModalLocked }),

  [RatingsActionTypes.RATINGS_SET_CURRENT_ROUTE_NAME]: (
    state: RatingsState,
    {
      payload: { currentRouteName },
    }: Action<RatingsSetCurrentRouteNamePayload>,
  ) => ({ ...state, currentRouteName }),

  [RatingsActionTypes.RATINGS_SET_HAPPY_MOMENT]: (
    state: RatingsState,
    { payload: { happyMoment } }: Action<RatingsSetHappyMomentPayload>,
  ) => ({ ...state, happyMoment }),

  [RatingsActionTypes.RATINGS_SET_DATA_OF_USER]: (
    state: RatingsState,
    { payload: { dataOfUser } }: Action<RatingsDataOfUserPayload>,
  ) => ({ ...state, dataOfUser }),
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
  initialState,
);
