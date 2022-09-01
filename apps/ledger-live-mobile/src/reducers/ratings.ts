/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import type { RatingsState, State } from "../types/state";
import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";
import { GetReducerPayload } from "../types/helpers";

const initialState: RatingsState = {
  isRatingsModalOpen: false,
  currentRouteName: null,
  happyMoment: undefined,
  dataOfUser: undefined,
  isRatingsModalLocked: false,
};
const handlers = {
  RATINGS_SET_MODAL_OPEN: (
    state: RatingsState,
    {
      payload: isRatingsModalOpen,
    }: {
      payload: boolean;
    },
  ) => ({ ...state, isRatingsModalOpen }),
  RATINGS_SET_MODAL_LOCKED: (
    state: RatingsState,
    {
      payload: isRatingsModalLocked,
    }: {
      payload: boolean;
    },
  ) => ({ ...state, isRatingsModalLocked }),
  RATINGS_SET_CURRENT_ROUTE_NAME: (
    state: RatingsState,
    {
      payload: { currentRouteName },
    }: {
      payload: { currentRouteName?: string };
    },
  ) => ({ ...state, currentRouteName }),
  RATINGS_SET_HAPPY_MOMENT: (
    state: RatingsState,
    {
      payload: { happyMoment },
    }: {
      payload: { happyMoment?: RatingsHappyMoment };
    },
  ) => ({ ...state, happyMoment }),
  RATINGS_SET_DATA_OF_USER: (
    state: RatingsState,
    {
      payload: { dataOfUser },
    }: {
      payload: { dataOfUser?: RatingsDataOfUser };
    },
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

type Payload = GetReducerPayload<typeof handlers>;

export default handleActions<RatingsState, Payload>(handlers, initialState);
